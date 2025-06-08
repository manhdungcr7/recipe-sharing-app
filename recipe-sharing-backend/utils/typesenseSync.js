const { pool } = require('../config/db');
const { typesenseClient } = require('../config/typesense');

// Đồng bộ công thức từ MySQL vào Typesense
async function syncRecipesToTypesense() {
  try {
    console.log('Syncing recipes to Typesense...');
    const connection = await pool.getConnection();
    
    // Lấy tất cả công thức kèm thông tin tác giả và nguyên liệu
    const [recipes] = await connection.query(`
      SELECT 
        r.id, r.title, r.description, r.cooking_time, r.difficulty, r.category,
        r.author_id, r.status, r.image_url, r.created_at,
        u.name as author_name
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.is_deleted = 0 AND r.status = 'published'
    `);
    
    // Lấy nguyên liệu cho các công thức
    for (const recipe of recipes) {
      const [ingredients] = await connection.query(
        'SELECT name FROM ingredients WHERE recipe_id = ?',
        [recipe.id]
      );
      
      // Chuyển đổi timestamp thành số nguyên cho created_at
      recipe.created_at = new Date(recipe.created_at).getTime();
      
      // Thêm danh sách nguyên liệu vào dữ liệu công thức
      recipe.ingredients = ingredients.map(ingredient => ingredient.name);
      
      // Đảm bảo các trường số nguyên đúng định dạng
      recipe.cooking_time = recipe.cooking_time ? parseInt(recipe.cooking_time) : 0;
      recipe.author_id = parseInt(recipe.author_id);
      recipe.id = parseInt(recipe.id);
    }
    
    connection.release();
    
    try {
      // Kiểm tra kết nối Typesense
      await typesenseClient.health.retrieve();
      
      // Xóa collection recipes hiện tại (nếu có) và tạo lại
      try {
        await typesenseClient.collections('recipes').delete();
        console.log('Deleted existing recipes collection');
      } catch (error) {
        if (error.httpStatus !== 404) {
          console.error('Error deleting recipes collection:', error);
        }
      }
      
      // Tạo lại collection recipes với schema
      await typesenseClient.collections().create({
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
      });
      
      // Import tất cả công thức vào Typesense
      if (recipes.length > 0) {
        const importResults = await typesenseClient.collections('recipes').documents().import(recipes);
        console.log(`Imported ${recipes.length} recipes into Typesense`);
        const failedCount = importResults.filter(result => result.success === false).length;
        if (failedCount > 0) {
          console.error(`Failed to import ${failedCount} recipes`);
        }
      }
    } catch (error) {
      console.error('Error with Typesense operations:', error);
      // Không throw lỗi, chỉ log và tiếp tục
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing recipes to Typesense:', error);
    return false;
  }
}

// Đồng bộ người dùng từ MySQL vào Typesense
async function syncUsersToTypesense() {
  try {
    console.log('Syncing users to Typesense...');
    const connection = await pool.getConnection();
    
    // Lấy tất cả người dùng và đếm số công thức của họ
    const [users] = await connection.query(`
      SELECT 
        u.id, u.name, u.email, u.bio, u.picture,
        COUNT(r.id) as recipe_count
      FROM users u
      LEFT JOIN recipes r ON u.id = r.author_id AND r.is_deleted = 0 AND r.status = 'published'
      WHERE u.is_blocked = 0
      GROUP BY u.id
    `);
    
    connection.release();
    
    // Đảm bảo các trường số nguyên đúng định dạng
    users.forEach(user => {
      user.id = parseInt(user.id);
      user.recipe_count = parseInt(user.recipe_count || 0);
    });
    
    try {
      // Kiểm tra kết nối Typesense
      await typesenseClient.health.retrieve();
      
      // Xóa collection users hiện tại (nếu có) và tạo lại
      try {
        await typesenseClient.collections('users').delete();
        console.log('Deleted existing users collection');
      } catch (error) {
        if (error.httpStatus !== 404) {
          console.error('Error deleting users collection:', error);
        }
      }
      
      // Tạo lại collection users với schema
      await typesenseClient.collections().create({
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
      });
      
      // Import tất cả người dùng vào Typesense
      if (users.length > 0) {
        const importResults = await typesenseClient.collections('users').documents().import(users);
        console.log(`Imported ${users.length} users into Typesense`);
        const failedCount = importResults.filter(result => result.success === false).length;
        if (failedCount > 0) {
          console.error(`Failed to import ${failedCount} users`);
        }
      }
    } catch (error) {
      console.error('Error with Typesense operations:', error);
      // Không throw lỗi, chỉ log và tiếp tục
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing users to Typesense:', error);
    return false;
  }
}

// Đồng bộ cả hai collection
async function syncAllToTypesense() {
  try {
    console.log('Starting full Typesense sync...');
    
    // Kiểm tra kết nối Typesense trước
    try {
      await typesenseClient.health.retrieve();
    } catch (error) {
      console.error('Typesense connection failed, skipping sync:', error);
      return false;
    }
    
    await syncRecipesToTypesense();
    await syncUsersToTypesense();
    console.log('Full Typesense sync completed');
    return true;
  } catch (error) {
    console.error('Error during full Typesense sync:', error);
    return false;
  }
}

module.exports = {
  syncRecipesToTypesense,
  syncUsersToTypesense,
  syncAllToTypesense
};