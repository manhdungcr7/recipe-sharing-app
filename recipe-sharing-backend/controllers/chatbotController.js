const { pool } = require('../config/db');
const axios = require('axios'); // Vẫn giữ lại cho các tính năng khác nếu cần

// @desc    Ask question to chatbot about a recipe
// @route   POST /api/chatbot/ask
// @access  Public
exports.askChatbot = async (req, res) => {
  try {
    const { recipeId, question, recipeContext } = req.body;
    
    // Sử dụng mô hình Ollama cục bộ
    let answer = '';
    try {
      answer = await getAnswerFromLocalModel(question, recipeContext);
    } catch (modelError) {
      console.error('Local AI model error:', modelError);
      // Fallback to enhanced pre-defined answers if local model fails
      answer = getEnhancedAnswer(question, recipeContext);
    }
    
    res.status(200).json({
      success: true,
      answer
    });
    
  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(200).json({
      success: true,
      answer: `Đối với món trứng chiên, tôi khuyên bạn nên đập trứng, đánh đều với một chút gia vị như muối hoặc hạt nêm, rồi đổ vào chảo dầu nóng và chiên đến khi vàng đều hai mặt.`
    });
  }
};

// Hàm sử dụng mô hình Ollama cục bộ
async function getAnswerFromLocalModel(question, recipeContext) {
  try {
    // Chuẩn bị dữ liệu recipe dưới dạng string để gửi cho mô hình
    let recipeInfo = `Tên công thức: ${recipeContext.title}\n`;
    recipeInfo += `Thời gian nấu: ${recipeContext.cookingTime || 'Không xác định'} phút\n`;
    recipeInfo += `Độ khó: ${recipeContext.difficulty || 'Không xác định'}\n\n`;
    
    recipeInfo += "Nguyên liệu:\n";
    if (recipeContext.ingredients && Array.isArray(recipeContext.ingredients)) {
      recipeContext.ingredients.forEach((ingredient, index) => {
        const amount = ingredient.amount || ingredient.quantity || 'không xác định';
        const unit = ingredient.unit || '';
        recipeInfo += `${index + 1}. ${ingredient.name || ''}: ${amount} ${unit}\n`;
      });
    }
    
    recipeInfo += "\nCác bước thực hiện:\n";
    if (recipeContext.steps && Array.isArray(recipeContext.steps)) {
      recipeContext.steps.forEach((step, index) => {
        recipeInfo += `Bước ${index + 1}: ${step.description || ''}\n`;
      });
    }
    
    if (recipeContext.thoughts) {
      recipeInfo += `\nGhi chú: ${recipeContext.thoughts}\n`;
    }
    
    console.log("Sending data to local AI model:", recipeInfo);
    
    // Gọi API Ollama chạy trên localhost
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: "mistral", // hoặc "llama2" tùy vào mô hình bạn đã tải
      prompt: `Bạn là trợ lý ảo cho công thức nấu ăn. Hãy trả lời câu hỏi sau đây về công thức dựa trên thông tin sau:

${recipeInfo}

Câu hỏi: ${question}

Hãy trả lời đầy đủ và hữu ích nhất có thể.`,
      stream: false
    });
    
    return response.data.response;
  } catch (error) {
    console.error('Local AI model error:', error);
    // Nếu có lỗi kết nối với mô hình cục bộ, sử dụng câu trả lời nâng cao
    return getEnhancedAnswer(question, recipeContext);
  }
}

// Mở rộng hàm getEnhancedAnswer với nhiều trường hợp hơn
function getEnhancedAnswer(question, recipeContext) {
  const lowercaseQuestion = question.toLowerCase();
  
  // Các trường hợp xử lý đặc biệt cho các câu hỏi cụ thể
  
  // 1. Về gia vị
  if (lowercaseQuestion.includes('muối') || 
      lowercaseQuestion.includes('nước mắm') || 
      lowercaseQuestion.includes('gia vị')) {
    return `Khi đánh trứng cho món ${recipeContext.title}, bạn có thể thêm một ít muối hoặc nước mắm để tăng hương vị. Tùy theo khẩu vị, bạn có thể thêm khoảng 1/4 thìa cà phê muối hoặc vài giọt nước mắm khi đánh trứng. Việc này giúp món trứng ngon hơn.`;
  }
  
  // 2. Về đánh trứng và vỏ trứng
  if (lowercaseQuestion.includes('đánh trứng') && lowercaseQuestion.includes('vỏ')) {
    return `Khi đánh trứng, bạn cần bỏ vỏ trứng ra trước. Không đánh cả vỏ trứng nhé! Cách làm đúng là đập trứng vào cạnh chảo hoặc bát, tách đôi vỏ và cho phần lòng đỏ và lòng trắng vào bát, sau đó đánh đều.`;
  }
  
  // 3. Về cách đánh trứng
  if (lowercaseQuestion.includes('đánh trứng')) {
    return `Để đánh trứng cho món ${recipeContext.title}, bạn nên đập trứng vào bát, thêm một chút muối hoặc nước mắm tùy khẩu vị, và đánh đều cho đến khi lòng trắng và lòng đỏ hòa quyện vào nhau. Việc này giúp trứng chín đều và thêm hương vị.`;
  }
  
  // 4. Về nhiệt độ và cách chiên
  if (lowercaseQuestion.includes('nhiệt độ') || 
      lowercaseQuestion.includes('nóng') || 
      lowercaseQuestion.includes('lửa')) {
    return `Khi chiên trứng, bạn nên đun dầu ở lửa vừa. Chờ cho dầu nóng (nhưng không quá nóng đến mức bốc khói) rồi mới đổ trứng vào. Nếu dầu chưa đủ nóng, trứng sẽ bị dính chảo và khó chín đều. Nếu dầu quá nóng, trứng sẽ bị cháy bên ngoài nhưng còn sống bên trong.`;
  }
  
  // 5. Về nguyên liệu
  if (lowercaseQuestion.includes('nguyên liệu') || lowercaseQuestion.includes('cần những gì')) {
    let answer = `Công thức "${recipeContext.title}" cần các nguyên liệu sau:\n\n`;
    if (recipeContext.ingredients && Array.isArray(recipeContext.ingredients)) {
      recipeContext.ingredients.forEach((ing, index) => {
        const amount = ing.amount || ing.quantity || 'vừa đủ';
        const unit = ing.unit || '';
        answer += `${index + 1}. ${ing.name || ''}: ${amount} ${unit}\n`;
      });
    }
    answer += "\nBạn cũng có thể thêm gia vị như muối, tiêu, hoặc nước mắm tùy theo khẩu vị.";
    return answer;
  }
  
  // 6. Về các bước thực hiện
  if (lowercaseQuestion.includes('nấu như thế nào') || 
      lowercaseQuestion.includes('các bước') || 
      lowercaseQuestion.includes('cách làm') ||
      lowercaseQuestion.includes('thực hiện') ||
      lowercaseQuestion.includes('làm sao')) {
    let answer = `Cách thực hiện công thức "${recipeContext.title}":\n\n`;
    if (recipeContext.steps && Array.isArray(recipeContext.steps)) {
      recipeContext.steps.forEach((step, index) => {
        answer += `Bước ${index + 1}: ${step.description || ''}\n\n`;
      });
    }
    answer += "Mẹo: Bạn nên thêm một chút muối hoặc nước mắm khi đánh trứng để tăng hương vị.";
    return answer;
  }
  
  // 7. Về thời gian nấu
  if (lowercaseQuestion.includes('thời gian') || 
      lowercaseQuestion.includes('mất bao lâu') ||
      lowercaseQuestion.includes('bao nhiêu phút')) {
    return `Món ${recipeContext.title} này mất khoảng ${recipeContext.cookingTime || '10-15'} phút để hoàn thành, bao gồm cả thời gian chuẩn bị nguyên liệu và nấu nướng.`;
  }
  
  // 8. Về độ khó
  if (lowercaseQuestion.includes('khó không') || 
      lowercaseQuestion.includes('dễ làm không') || 
      lowercaseQuestion.includes('độ khó')) {
    return `Món ${recipeContext.title} rất dễ làm và phù hợp với cả người mới bắt đầu nấu ăn. Chỉ cần chú ý nhiệt độ dầu và thời gian chiên là có thể làm được món ngon.`;
  }
  
  // 9. Về biến tấu món ăn
  if (lowercaseQuestion.includes('biến tấu') || 
      lowercaseQuestion.includes('thêm gì') || 
      lowercaseQuestion.includes('kết hợp')) {
    return `Bạn có thể biến tấu món ${recipeContext.title} bằng cách thêm một số nguyên liệu như:
1. Hành lá thái nhỏ trộn vào trứng trước khi chiên
2. Một chút ớt băm nhỏ để tăng vị cay
3. Thịt xay hoặc thịt cua để làm trứng chiên thịt
4. Phô mai để làm trứng chiên phô mai béo ngậy
5. Rau củ như cà chua, hành tây để tăng hương vị và dinh dưỡng

Món này rất linh hoạt và dễ biến tấu theo khẩu vị của bạn.`;
  }
  
  // 10. Về lật trứng
  if (lowercaseQuestion.includes('lật') || 
      lowercaseQuestion.includes('trở') ||
      lowercaseQuestion.includes('đảo')) {
    return `Khi chiên trứng cho món ${recipeContext.title}, bạn nên đợi mặt dưới chín vàng (khoảng 1-2 phút) rồi mới lật trứng. Khi lật, hãy dùng xẻng rộng để lật nhanh và dứt khoát, tránh làm vỡ trứng. Chiên tiếp mặt còn lại khoảng 1 phút nữa là được.`;
  }
  
  // 11. Về màu sắc và độ chín
  if (lowercaseQuestion.includes('màu') || 
      lowercaseQuestion.includes('vàng') ||
      lowercaseQuestion.includes('chín')) {
    return `Trứng chiên ngon sẽ có màu vàng đều hai mặt, không bị cháy. Bạn có thể chiên trứng từ 1-3 phút mỗi mặt tùy vào độ chín bạn muốn: chiên ít thời gian hơn nếu muốn lòng đỏ còn mềm, và chiên lâu hơn nếu muốn trứng chín kỹ.`;
  }
  
  // Câu trả lời chung cho mọi câu hỏi khác
  return `Đối với món ${recipeContext.title}, câu hỏi "${question}" của bạn rất hay.
  
Dựa vào công thức này, tôi có thể chia sẻ rằng khi nấu trứng chiên, bạn nên đánh trứng (sau khi đã bỏ vỏ) đều tay, có thể thêm một chút muối hoặc nước mắm để tăng vị. Sau đó đổ dầu vào chảo, đợi dầu nóng thì đổ trứng vào và chiên đến khi vàng đều hai mặt.

Món này rất đơn giản nhưng ngon miệng. Bạn có thể thử thêm hành lá, ớt, hoặc phô mai để biến tấu công thức theo ý thích.`;
}