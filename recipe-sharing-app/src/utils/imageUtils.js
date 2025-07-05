// Tạo file mới với các hàm tiện ích

// Sinh màu ngẫu nhiên cho ảnh đại diện và ảnh công thức
export const getRandomColor = () => {
  const colors = [
    '#FF6B6B', '#FF8E8E', '#FFA5A5', '#FFBDBD',  // Shades of red
    '#4ECDC4', '#70DBCE', '#92E9D9', '#B4F7E4',  // Shades of teal
    '#FFD166', '#FFD980', '#FFE199', '#FFEAB3',  // Shades of yellow
    '#6B5B95', '#8675A9', '#A18FC0', '#BBA9D7',  // Shades of purple
    '#88D8B0', '#A1E1C1', '#BBE9D3', '#D4F2E4',  // Shades of mint
    '#F38181', '#F59E9E', '#F7BCBC', '#F9DADA',  // Shades of salmon
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Utility functions cho xử lý hình ảnh
 */

// Tạo URL avatar từ tên người dùng
export const generateAvatarUrl = (name) => {
  if (!name) return 'https://ui-avatars.com/api/?background=random&name=User';
  
  const formattedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?background=random&name=${formattedName}`;
};

// Lấy URL đầy đủ cho hình ảnh (avatar hoặc recipe)
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `http://localhost:5000${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
};

// Lấy URL đầy đủ cho hình ảnh recipe với fallback
export const getRecipeImageUrl = (imagePath) => {
  if (!imagePath) return 'C:\Users\Lenovo\Documents\web_SE\recipe-sharing-app\public\default-recipe.jpg';
  
  if (imagePath.startsWith('http')) return imagePath;
  
  return `http://localhost:5000${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
};

// Lấy URL đầy đủ cho hình ảnh avatar với fallback
export const getAvatarUrl = (imagePath) => {
  if (!imagePath) return '/default-avatar.jpg';
  
  if (imagePath.startsWith('http')) return imagePath;
  
  return `http://localhost:5000${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
};

// Kiểm tra file được chọn có đúng định dạng không
export const isValidImageType = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return file && validTypes.includes(file.type);
};

// Kiểm tra kích thước file có hợp lệ không
export const isValidFileSize = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return file && file.size <= maxSizeBytes;
};