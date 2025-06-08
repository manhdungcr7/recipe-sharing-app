const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đường dẫn lưu trữ file
const recipeUploadsDir = path.join(__dirname, '../public/uploads/recipes');
const stepUploadsDir = path.join(__dirname, '../public/uploads/steps');
const avatarUploadsDir = path.join(__dirname, '../public/uploads/avatars');

// Tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync(path.dirname(recipeUploadsDir))) {
  fs.mkdirSync(path.dirname(recipeUploadsDir), { recursive: true });
}
if (!fs.existsSync(recipeUploadsDir)) {
  fs.mkdirSync(recipeUploadsDir, { recursive: true });
}
if (!fs.existsSync(stepUploadsDir)) {
  fs.mkdirSync(stepUploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarUploadsDir)) {
  fs.mkdirSync(avatarUploadsDir, { recursive: true });
}

// Cấu hình storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Phân loại thư mục lưu file dựa vào fieldname
    console.log("Processing file upload:", file.fieldname);
    
    if (file.fieldname === 'image') {
      console.log("Saving to recipes directory:", recipeUploadsDir);
      cb(null, recipeUploadsDir);
    } else if (file.fieldname === 'avatar') {
      cb(null, avatarUploadsDir);
    } else if (file.fieldname.startsWith('step_images')) {
      console.log("Saving to steps directory:", stepUploadsDir);
      cb(null, stepUploadsDir);
    } else {
      console.log("Unknown field type:", file.fieldname);
      cb(new Error('Không hỗ trợ loại file này'), false);
    }
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất
    const ext = path.extname(file.originalname);
    let prefix = 'recipe';
    
    if (file.fieldname === 'avatar') {
      prefix = 'avatar';
    } else if (file.fieldname.startsWith('step_images')) {
      prefix = 'step-image';
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${prefix}-${uniqueSuffix}${ext}`;
    console.log("Generated filename:", filename);
    cb(null, filename);
  }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' || file.fieldname.startsWith('step_images')) {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  } else {
    cb(new Error('Loại file không được hỗ trợ!'), false);
  }
};

// Cấu hình upload cho nhiều fields (recipe + step images)
const recipeMultiUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cho video
  fileFilter
}).any(); // Sử dụng .any() để chấp nhận mọi field

// Tạo middleware upload cho recipe (single image)
const recipeUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cho recipe image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
}).single('image');

// Tạo middleware upload cho avatar
const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB cho avatar
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
}).single('avatar');

module.exports = {
  recipeUpload,
  recipeMultiUpload,
  avatarUpload
};