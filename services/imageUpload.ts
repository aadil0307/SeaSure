import { IMGBB_API_KEY } from '@env';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

class ImageUploadService {
  private readonly API_KEY = IMGBB_API_KEY;
  private readonly BASE_URL = 'https://api.imgbb.com/1/upload';

  async uploadImage(imageUri: string, name?: string): Promise<string> {
    try {
      // Create form data
      const formData = new FormData();
      
      // Add the image file
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: name || 'profile_picture.jpg',
      } as any);

      // Add API key
      formData.append('key', this.API_KEY);

      // Add optional name
      if (name) {
        formData.append('name', name);
      }

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ImgBBResponse = await response.json();

      if (result.success) {
        return result.data.url;
      } else {
        throw new Error('Failed to upload image to ImgBB');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  async uploadProfilePicture(imageUri: string, userId: string): Promise<string> {
    try {
      const imageName = `profile_${userId}_${Date.now()}`;
      return await this.uploadImage(imageUri, imageName);
    } catch (error) {
      console.error('Profile picture upload error:', error);
      throw error;
    }
  }

  // Validate image before upload
  validateImage(imageUri: string): boolean {
    // Add basic validation logic
    if (!imageUri || imageUri.trim() === '') {
      return false;
    }

    // Check if it's a valid URI format
    try {
      new URL(imageUri);
      return true;
    } catch {
      // Local file path is also valid
      return imageUri.startsWith('file://') || imageUri.startsWith('/');
    }
  }

  // Get image size from URI (for validation)
  async getImageInfo(imageUri: string): Promise<{ width: number; height: number; size?: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({
          width: image.width,
          height: image.height,
        });
      };
      image.onerror = reject;
      image.src = imageUri;
    });
  }
}

export const imageUploadService = new ImageUploadService();
export default imageUploadService;
