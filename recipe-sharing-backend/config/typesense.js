const Typesense = require('typesense');

const typesenseClient = new Typesense.Client({
  nodes: [{
    host: 'localhost',
    port: '8108',
    protocol: 'http'
  }],
  apiKey: 'Hu52dwsas2AdxdE', // Thay đổi API key này
  connectionTimeoutSeconds: 2
});

// Schema cho công thức
const recipeSchema = {
  name: 'recipes',
  fields: [
    { name: 'id', type: 'int32' },
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string', optional: true },
    { name: 'author_id', type: 'int32' },
    { name: 'author_name', type: 'string' },
    { name: 'ingredients', type: 'string[]', optional: true },
    { name: 'category', type: 'string', optional: true },
    { name: 'cooking_time', type: 'int32', optional: true },
    { name: 'difficulty', type: 'string', optional: true },
    { name: 'created_at', type: 'int64' },
    { name: 'image_url', type: 'string', optional: true },
    { name: 'status', type: 'string' }
  ],
  default_sorting_field: 'created_at'
};

// Schema cho người dùng
const userSchema = {
  name: 'users',
  fields: [
    { name: 'id', type: 'int32' },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'bio', type: 'string', optional: true },
    { name: 'picture', type: 'string', optional: true },
    { name: 'recipe_count', type: 'int32' }
  ],
  default_sorting_field: 'recipe_count'
};

async function setupTypesenseCollections() {
  try {
    console.log('Setting up Typesense collections...');
    
    // Kiểm tra kết nối Typesense trước
    try {
      await typesenseClient.health.retrieve();
      console.log('Typesense connection successful');
    } catch (error) {
      console.error('Typesense connection failed:', error);
      return false;
    }
    
    // Tạo collection recipes nếu chưa tồn tại
    try {
      await typesenseClient.collections('recipes').retrieve();
      console.log('Recipe collection exists');
    } catch (error) {
      if (error.httpStatus === 404) {
        await typesenseClient.collections().create(recipeSchema);
        console.log('Created recipes collection');
      } else {
        console.error('Error checking recipes collection:', error);
      }
    }
    
    // Tạo collection users nếu chưa tồn tại
    try {
      await typesenseClient.collections('users').retrieve();
      console.log('Users collection exists');
    } catch (error) {
      if (error.httpStatus === 404) {
        await typesenseClient.collections().create(userSchema);
        console.log('Created users collection');
      } else {
        console.error('Error checking users collection:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up Typesense collections:', error);
    return false;
  }
}

module.exports = {
  typesenseClient,
  setupTypesenseCollections
};