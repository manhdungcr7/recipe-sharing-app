// Cập nhật hàm submit để xử lý lỗi khi tài khoản bị khóa
const handleSubmit = async (e) => {
  e.preventDefault();
  // Existing code
  
  try {
    // Existing code
    
    const response = await fetch('http://localhost:5000/api/recipes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Other headers
      },
      body: formData
    });
    
    if (response.status === 403) {
      // Tài khoản bị khóa
      const data = await response.json();
      alert(data.message);
      return;
    }
    
    // Rest of your code
    
  } catch (error) {
    console.error('Error creating recipe:', error);
    setError('Lỗi khi tạo công thức');
  } finally {
    setIsSubmitting(false);
  }
};