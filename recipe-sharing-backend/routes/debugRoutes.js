const express = require('express');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Endpoint để kiểm tra và debug hình ảnh
router.get('/images', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../public/uploads/recipes');
    const uploadsExists = fs.existsSync(uploadsDir);
    
    let files = [];
    if (uploadsExists) {
      files = fs.readdirSync(uploadsDir);
    }
    
    const connection = await pool.getConnection();
    const [recipes] = await connection.query(
      'SELECT id, title, image_url FROM recipes WHERE image_url IS NOT NULL'
    );
    
    const imageStatus = await Promise.all(recipes.map(async (recipe) => {
      if (!recipe.image_url) return { ...recipe, fileExists: false };
      
      let filePath;
      if (recipe.image_url.startsWith('/')) {
        filePath = path.join(__dirname, '../public', recipe.image_url);
      } else {
        filePath = path.join(__dirname, '../public', recipe.image_url);
      }
      
      const fileExists = fs.existsSync(filePath);
      
      return {
        ...recipe,
        filePath,
        fileExists,
        fullUrl: `http://localhost:5000${recipe.image_url.startsWith('/') ? recipe.image_url : '/' + recipe.image_url}`
      };
    }));
    
    connection.release();
    
    res.json({
      uploadsDir,
      uploadsExists,
      files,
      recipes: imageStatus
    });
    
  } catch (error) {
    console.error('Debug images error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint kiểm tra header
router.get('/headers', (req, res) => {
  const testImagePath = '/uploads/recipes/recipe-1748584427993-438724863.jpg';
  
  fetch(`http://localhost:5000${testImagePath}`)
    .then(response => {
      const headers = {};
      for (const [key, value] of response.headers.entries()) {
        headers[key] = value;
      }
      
      res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: headers,
        testImageUrl: `http://localhost:5000${testImagePath}`
      });
    })
    .catch(error => {
      res.json({
        success: false,
        error: error.message
      });
    });
});

// Endpoint để xem trực tiếp ảnh và debug
router.get('/direct-image-check', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [recipes] = await connection.query(
      'SELECT id, title, image_url FROM recipes WHERE image_url IS NOT NULL LIMIT 10'
    );
    connection.release();
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Direct Image Check</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        .images { display: flex; flex-wrap: wrap; gap: 20px; }
        .image-box { border: 1px solid #ddd; padding: 10px; width: 300px; }
        img { max-width: 100%; height: auto; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Direct Image Check</h1>
      <pre>${JSON.stringify(recipes, null, 2)}</pre>
      
      <div class="images">
    `;
    
    recipes.forEach(recipe => {
      if (recipe.image_url) {
        const imagePath = recipe.image_url.startsWith('/') 
          ? recipe.image_url 
          : `/${recipe.image_url}`;
          
        const imageUrl = `http://localhost:5000${imagePath}`;
        
        html += `
          <div class="image-box">
            <h3>${recipe.title} (ID: ${recipe.id})</h3>
            <p>Image URL: ${recipe.image_url}</p>
            <img src="${imageUrl}" alt="${recipe.title}" 
                 onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(recipe.title)}&background=random'">
          </div>
        `;
      }
    });
    
    html += `
      </div>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Direct image check error:', error);
    res.status(500).send('Error checking images');
  }
});

// Endpoint để kiểm tra trực tiếp các file hình ảnh
router.get('/check-images', (req, res) => {
  try {
    // Kiểm tra thư mục recipes
    const recipeUploadsDir = path.join(__dirname, '../public/uploads/recipes');
    const recipeFiles = fs.existsSync(recipeUploadsDir) ? fs.readdirSync(recipeUploadsDir) : [];
    
    // Kiểm tra thư mục steps
    const stepUploadsDir = path.join(__dirname, '../public/uploads/steps');
    const stepFiles = fs.existsSync(stepUploadsDir) ? fs.readdirSync(stepUploadsDir) : [];
    
    res.send(`
      <h1>Debug Image Files</h1>
      <h2>Recipe Images:</h2>
      <ul>
        ${recipeFiles.map(file => `
          <li>
            <a href="/uploads/recipes/${file}" target="_blank">${file}</a>
            <img src="/uploads/recipes/${file}" alt="${file}" style="max-width: 200px; max-height: 200px;">
          </li>
        `).join('')}
      </ul>
      
      <h2>Step Images/Videos:</h2>
      <ul>
        ${stepFiles.map(file => `
          <li>
            <a href="/uploads/steps/${file}" target="_blank">${file}</a>
            ${file.match(/\.(jpg|jpeg|png|gif|webp)$/i) 
              ? `<img src="/uploads/steps/${file}" alt="${file}" style="max-width: 200px; max-height: 200px;">` 
              : file.match(/\.(mp4|webm|ogg)$/i) 
                ? `<video src="/uploads/steps/${file}" controls style="max-width: 200px; max-height: 200px;">` 
                : ''}
          </li>
        `).join('')}
      </ul>
    `);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// @route   GET /api/debug/routes
// @desc    List all API routes for debugging
// @access  Public
router.get('/routes', (req, res) => {
  const routes = [];
  
  // Get all registered routes in Express
  const server = req.app;
  
  // Helper function to extract routes from a layer
  function extractRoutes(path, layer) {
    if (layer.route) {
      const routePath = path + layer.route.path;
      const methods = Object.keys(layer.route.methods)
        .filter(method => method !== '_all')
        .map(method => method.toUpperCase());
      
      routes.push({
        path: routePath,
        methods
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      const routerPath = path + (layer.regexp.toString().indexOf('^\\') !== -1 ? '' : '/');
      
      layer.handle.stack.forEach((stackItem) => {
        extractRoutes(routerPath, stackItem);
      });
    }
  }
  
  // Extract routes from application stack
  server._router.stack.forEach((layer) => {
    extractRoutes('', layer);
  });
  
  // Sort routes for easier reading
  routes.sort((a, b) => a.path.localeCompare(b.path));
  
  res.status(200).json({
    success: true,
    count: routes.length,
    routes
  });
});

// Thêm route dưới đây để kiểm tra route matching
router.get('/route-test/:route(*)', (req, res) => {
  const testRoute = req.params.route; // Lấy route từ URL
  const method = req.query.method || 'GET';
  
  // Tìm tất cả router layers đang được đăng ký trong ứng dụng
  const app = req.app;
  const matchedRoutes = [];
  
  // Helper function để kiểm tra một route có khớp với một URL không
  const doesRouteMatch = (route, path) => {
    try {
      const pattern = route.regexp;
      return pattern.test(path);
    } catch (e) {
      return false;
    }
  };
  
  // Function để kiểm tra route trong middleware
  const checkMiddleware = (middleware, basePath = '') => {
    if (middleware.route) {
      const fullPath = basePath + middleware.route.path;
      const methods = Object.keys(middleware.route.methods);
      
      if (methods.includes(method.toLowerCase())) {
        const isMatch = doesRouteMatch(middleware, testRoute);
        
        matchedRoutes.push({
          path: fullPath,
          methods,
          matched: isMatch
        });
      }
    } else if (middleware.name === 'router') {
      // Router middleware có stack riêng
      const routerPath = basePath + (middleware.regexp.toString().indexOf('^\\/') === 1 ? '' : '/');
      
      middleware.handle.stack.forEach((handler) => {
        checkMiddleware(handler, routerPath);
      });
    }
  };
  
  // Kiểm tra tất cả các middleware
  app._router.stack.forEach((middleware) => {
    checkMiddleware(middleware);
  });
  
  res.json({
    testRoute: `/${testRoute}`,
    method,
    matchedRoutes: matchedRoutes.filter(r => r.matched),
    allRoutes: matchedRoutes
  });
});

module.exports = router;