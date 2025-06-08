const { pool } = require('../../config/db');
const PDFDocument = require('pdfkit');

exports.exportRecipePDF = async (req, res) => {
  const recipeId = req.params.id;
  try {
    const connection = await pool.getConnection();
    const [recipes] = await connection.query(
      `SELECT r.*, u.name as author_name FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.id = ? AND r.is_deleted = 0`,
      [recipeId]
    );
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Không tìm thấy công thức' });
    }
    const recipe = recipes[0];

    // Lấy nguyên liệu
    const [ingredients] = await connection.query(
      'SELECT name, quantity, unit FROM ingredients WHERE recipe_id = ?',
      [recipeId]
    );
    // Lấy các bước
    const [steps] = await connection.query(
      'SELECT description FROM steps WHERE recipe_id = ? ORDER BY order_index ASC',
      [recipeId]
    );
    connection.release();

    // Tạo PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recipe-${recipeId}.pdf"`);

    doc.fontSize(20).text(recipe.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tác giả: ${recipe.author_name}`);
    doc.text(`Thời gian nấu: ${recipe.cooking_time || 'Không rõ'} phút`);
    doc.text(`Suy nghĩ: ${recipe.thoughts || ''}`);
    doc.moveDown();

    doc.fontSize(16).text('Nguyên liệu:', { underline: true });
    ingredients.forEach(ing => {
      doc.fontSize(12).text(`- ${ing.name} ${ing.quantity ? ing.quantity : ''} ${ing.unit ? ing.unit : ''}`);
    });
    doc.moveDown();

    doc.fontSize(16).text('Các bước thực hiện:', { underline: true });
    steps.forEach((step, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${step.description}`);
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xuất PDF', error: error.message });
  }
};