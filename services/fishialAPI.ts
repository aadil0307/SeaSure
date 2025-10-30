/**
 * Fishial API Service for Fish Species Detection
 * Integrates with Fishial AI to automatically identify fish species from images
 * 
 * REAL API IMPLEMENTATION based on official documentation
 * API Flow: Auth Token → Upload Image → Recognition → Results
 * 
 * API Credentials (provided by user):
 * - API Key: b7fd36488de61c6b050a7550  
 * - Secret: 17492a8c3a76f363cef01efb964e2f0a
 */
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { realFishialAPIService } from './realFishialAPI';

export interface FishialDetectionResult {
  species: string;
  confidence: number;
  scientificName?: string;
  commonNames?: string[];
  habitat?: string;
  size?: string;
  characteristics?: string[];
  edible?: boolean;
  conservationStatus?: string;
}

export interface FishialAPIResponse {
  success: boolean;
  data?: FishialDetectionResult[];
  error?: string;
  requestId?: string;
  processingTime?: number;
  timestamp?: number;
}

class FishialAPIService {
  // Real Fishial API credentials (from user)
  private readonly CLIENT_ID = 'b7fd36488de61c6b050a7550';
  private readonly CLIENT_SECRET = '17492a8c3a76f363cef01efb964e2f0a';
  
  // Official Fishial API endpoints (from documentation)
  private readonly AUTH_URL = 'https://api-users.fishial.ai/v1/auth/token';
  private readonly API_BASE_URL = 'https://api.fishial.ai/v1';
  
  // Enable/disable mock mode for development
  public readonly MOCK_MODE = false// Set to false to use real API
  
  // Cache for access token
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  /**
   * Get OAuth access token for API authentication
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('🔐 Getting Fishial API access token...');
      
      const response = await fetch(this.AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const authData = await response.json();
      
      if (!authData.access_token) {
        throw new Error('No access token received');
      }

      // Cache token (expires in 10 minutes according to docs)
      this.accessToken = authData.access_token;
      this.tokenExpiry = Date.now() + (9 * 60 * 1000); // 9 minutes to be safe

      console.log('✅ Access token obtained successfully');
      return this.accessToken || '';
      
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * Upload image to Fishial cloud storage
   */
  private async uploadImage(imageUri: string): Promise<string> {
    try {
      console.log('📤 Uploading image to Fishial cloud...');
      
      // Get access token
      const token = await this.getAccessToken();
      
      // Prepare and compress image
      const imageData = await this.prepareImageForUpload(imageUri);
      
      // Get signed upload URL
      const uploadResponse = await fetch(`${this.API_BASE_URL}/recognition/upload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blob: {
            filename: imageData.filename,
            content_type: imageData.contentType,
            byte_size: imageData.byteSize,
            checksum: imageData.checksum,
          }
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload URL request failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      const { signed_id, direct_upload } = uploadData;

      // Upload image to signed URL
      const uploadImageResponse = await fetch(direct_upload.url, {
        method: 'PUT',
        headers: {
          ...direct_upload.headers,
          'Content-Type': '', // Must be empty according to docs
        },
        body: imageData.blob,
      });

      if (!uploadImageResponse.ok) {
        throw new Error(`Image upload failed: ${uploadImageResponse.status}`);
      }

      console.log('✅ Image uploaded successfully');
      return signed_id;
      
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Prepare image for upload with metadata calculation
   */
  private async prepareImageForUpload(imageUri: string) {
    // Compress image first
    const compressedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );

    // Get image blob
    const response = await fetch(compressedImage.uri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    // Calculate MD5 checksum
    const checksum = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      Array.from(new Uint8Array(arrayBuffer)).map(b => String.fromCharCode(b)).join(''),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );

    return {
      filename: 'fish_image.jpg',
      contentType: 'image/jpeg',
      byteSize: arrayBuffer.byteLength,
      checksum,
      blob,
    };
  }

  /**
   * Detect fish species from an image using real Fishial API
   */
  async detectFishSpecies(
    imageUri: string,
    options?: {
      maxResults?: number;
      minConfidence?: number;
      includeDetails?: boolean;
    }
  ): Promise<FishialAPIResponse> {
    try {
      // Prepare image data
      const imageData = await this.prepareImageData(imageUri);
      
      // Validate final image size to prevent 413 errors
      const imageSizeKB = (imageData.length * 0.75) / 1024;
      console.log(`📏 Final image payload size: ${imageSizeKB.toFixed(1)}KB`);
      
      if (imageSizeKB > 500) {
        throw new Error(`Image size (${imageSizeKB.toFixed(1)}KB) exceeds maximum allowed size. Please try with a smaller image.`);
      }

      // MOCK MODE: Return simulated results for development
      if (this.MOCK_MODE) {
        console.log('🐟 Using MOCK Fishial API response for development...');
        
        // Simulate API processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return this.getMockFishDetectionResult(options);
      }

      // REAL API MODE: Use actual Fishial API
      console.log('🐟 Using REAL Fishial API...');
      return await realFishialAPIService.detectFishSpecies(imageUri, options);
      
    } catch (error) {
      console.error('❌ Fishial API detection failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Prepare image data for API request with compression and size optimization
   */
  private async prepareImageData(imageUri: string): Promise<string> {
    try {
      console.log('🖼️ Preparing image for upload:', imageUri);
      
      // First, compress and resize the image to reduce file size
      const compressedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Resize to maximum 800px width while maintaining aspect ratio
          { resize: { width: 800 } }
        ],
        {
          // High compression to reduce file size (0.4 = 60% compression)
          compress: 0.4,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!compressedImage.base64) {
        throw new Error('Failed to generate base64 from compressed image');
      }

      // Check file size (base64 string length * 0.75 gives approximate byte size)
      const estimatedSizeKB = (compressedImage.base64.length * 0.75) / 1024;
      console.log(`📊 Compressed image size: ~${estimatedSizeKB.toFixed(1)}KB`);
      
      // If still too large (>400KB), compress further
      if (estimatedSizeKB > 400) {
        console.log('🗜️ Image still large, applying additional compression...');
        
        const furtherCompressed = await ImageManipulator.manipulateAsync(
          compressedImage.uri,
          [
            { resize: { width: 600 } }
          ],
          {
            compress: 0.2, // Even higher compression (80%)
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        if (!furtherCompressed.base64) {
          throw new Error('Failed to generate base64 from further compressed image');
        }

        const finalSizeKB = (furtherCompressed.base64.length * 0.75) / 1024;
        console.log(`✅ Final compressed image size: ~${finalSizeKB.toFixed(1)}KB`);
        
        return `data:image/jpeg;base64,${furtherCompressed.base64}`;
      }

      return `data:image/jpeg;base64,${compressedImage.base64}`;
      
    } catch (error) {
      console.error('❌ Image preparation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to prepare image for upload: ${errorMessage}`);
    }
  }

  /**
   * Map Fishial API response to our interface
   */
  private mapFishialResponse(apiResponse: any): FishialDetectionResult[] {
    if (!apiResponse.detections || !Array.isArray(apiResponse.detections)) {
      return [];
    }

    return apiResponse.detections.map((detection: any) => ({
      species: detection.species || detection.name || 'Unknown Species',
      confidence: detection.confidence || detection.score || 0,
      scientificName: detection.scientific_name || detection.latin_name,
      commonNames: detection.common_names || detection.aliases || [],
      habitat: detection.habitat,
      size: detection.typical_size || detection.size_range,
      characteristics: detection.characteristics || detection.features || [],
      edible: detection.edible,
      conservationStatus: detection.conservation_status || detection.iucn_status
    }));
  }

  /**
   * Test function to verify API connectivity and credentials
   * Call this to test real API before switching from mock mode
   */
  async testAPIConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testing Fishial API connection...');
      
      if (this.MOCK_MODE) {
        return {
          success: true,
          message: '✅ Mock mode is active. Set MOCK_MODE = false to test real API.'
        };
      }

      // Test real API connection
      return await realFishialAPIService.testConnection();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `❌ Connection test failed: ${errorMessage}`
      };
    }
  }

  /**
   * Mock implementation for development and testing
   * Returns simulated fish detection results
   */
  private getMockFishDetectionResult(options?: {
    maxResults?: number;
    minConfidence?: number;
    includeDetails?: boolean;
  }): FishialAPIResponse {
    const mockDetections: FishialDetectionResult[] = [
      {
        species: "King Fish",
        confidence: 0.92,
        scientificName: "Scomberomorus commerson",
        commonNames: ["Spanish Mackerel", "Narrow-barred Spanish Mackerel"],
        habitat: "Indo-Pacific coastal waters",
        size: "Up to 240cm, commonly 60-100cm",
        characteristics: ["Streamlined body", "Sharp teeth", "Silver coloration with dark spots"],
        edible: true,
        conservationStatus: "Least Concern"
      },
      {
        species: "Pomfret",
        confidence: 0.78,
        scientificName: "Pampus argenteus",
        commonNames: ["Silver Pomfret", "White Pomfret"],
        habitat: "Indo-West Pacific coastal waters",
        size: "Up to 60cm, commonly 25-35cm",
        characteristics: ["Laterally compressed body", "Silver coloration", "Forked tail"],
        edible: true,
        conservationStatus: "Near Threatened"
      },
      {
        species: "Mackerel",
        confidence: 0.65,
        scientificName: "Rastrelliger kanagurta",
        commonNames: ["Indian Mackerel", "Blue Mackerel"],
        habitat: "Indo-West Pacific waters",
        size: "Up to 35cm, commonly 15-25cm",
        characteristics: ["Streamlined body", "Metallic blue-green back", "Dark wavy lines"],
        edible: true,
        conservationStatus: "Least Concern"
      }
    ];

    // Filter by confidence threshold
    const minConfidence = options?.minConfidence || 0.3;
    const filteredDetections = mockDetections.filter(d => d.confidence >= minConfidence);

    // Limit results
    const maxResults = options?.maxResults || 3;
    const limitedDetections = filteredDetections.slice(0, maxResults);

    console.log(`✅ MOCK API: Returning ${limitedDetections.length} fish detections`);

    return {
      success: true,
      data: limitedDetections,
      requestId: `mock_${Date.now()}`,
      processingTime: 2.1,
      timestamp: Date.now()
    };
  }
}

export const fishialAPIService = new FishialAPIService();
export default fishialAPIService;