const { pool } = require('../config/db');
const axios = require('axios');
const config = require('../config/config');

// @desc    Ask question to chatbot about a recipe
// @route   POST /api/chatbot/ask
// @access  Public
exports.askChatbot = async (req, res) => {
  try {
    const { recipeId, question, recipeContext } = req.body;
    console.log("Question received:", question);
    console.log("Recipe context:", JSON.stringify(recipeContext).substring(0, 100) + "...");
    
    // Kiểm tra nếu câu hỏi quá ngắn hoặc không rõ ràng
    if (!question || question.trim().length < 2) {
      return res.status(200).json({
        success: true,
        answer: `Xin chào! Tôi là trợ lý ảo cho món ${recipeContext.title}. Bạn có thể hỏi tôi về nguyên liệu, cách nấu, hoặc mẹo nấu ăn cho món này.`
      });
    }
    
    try {
      // Giảm timeout xuống để tránh người dùng đợi quá lâu
      const answer = await getAnswerFromLocalModel(question, recipeContext, 15000); // 15 giây thay vì 30
      
      res.status(200).json({
        success: true,
        answer
      });
    } catch (ollmaError) {
      console.error('Error calling Ollama:', ollmaError);
      
      // Fallback sang phương pháp rule-based nếu Ollama thất bại
      const fallbackAnswer = getEnhancedAnswer(question, recipeContext);
      res.status(200).json({
        success: true,
        answer: fallbackAnswer,
        usingFallback: true
      });
    }
  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý câu hỏi',
      error: error.message
    });
  }
};

// Cập nhật hàm gọi Ollama API với timeout tùy chỉnh
async function getAnswerFromLocalModel(question, recipeContext, timeoutMs = 15000) {
  // Lấy cấu hình từ biến môi trường
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'mistral';
  
  // Chuẩn bị dữ liệu đầu vào cho LLM
  const prompt = formatPromptForRecipe(question, recipeContext);
  
  // Cấu hình request
  const requestData = {
    model: model,
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 500 // Giảm độ dài tối đa để cải thiện thời gian phản hồi
    }
  };
  
  // Gọi API Ollama
  console.log(`Calling Ollama API (${model}) with prompt length: ${prompt.length}`);
  
  const response = await axios.post(`${baseUrl}/api/generate`, requestData, {
    headers: { 'Content-Type': 'application/json' },
    timeout: timeoutMs
  });
  
  if (response.data && response.data.response) {
    console.log(`Ollama response length: ${response.data.response.length}`);
    return response.data.response.trim();
  } else {
    throw new Error('Invalid response from Ollama');
  }
}

// Hàm để tạo prompt tốt cho LLM
function formatPromptForRecipe(question, recipeContext) {
  // Chuẩn bị thông tin công thức dưới dạng văn bản
  let ingredientsText = '';
  if (recipeContext.ingredients && Array.isArray(recipeContext.ingredients)) {
    ingredientsText = recipeContext.ingredients.map((ing, index) => {
      const amount = ing.amount || ing.quantity || 'vừa đủ';
      const unit = ing.unit || '';
      return `${index + 1}. ${ing.name || ''}: ${amount} ${unit}`;
    }).join('\n');
  }
  
  let stepsText = '';
  if (recipeContext.steps && Array.isArray(recipeContext.steps)) {
    stepsText = recipeContext.steps.map((step, index) => {
      return `Bước ${index + 1}: ${step.description || ''}`;
    }).join('\n');
  }
  
  // Tạo prompt với hướng dẫn cụ thể cho LLM
  return `Bạn là trợ lý ẩm thực chuyên nghiệp. Hãy trả lời câu hỏi sau về món ăn.

THÔNG TIN MÓN ĂN:
Tên món: ${recipeContext.title || 'Không có tên'}
Thời gian nấu: ${recipeContext.cookingTime || 'Không xác định'} phút
Lưu ý: ${recipeContext.thoughts || 'Không có lưu ý đặc biệt'}

NGUYÊN LIỆU:
${ingredientsText || 'Không có thông tin nguyên liệu'}

CÁCH LÀM:
${stepsText || 'Không có thông tin các bước nấu'}

CÂU HỎI CỦA NGƯỜI DÙNG:
${question}

Hãy trả lời ngắn gọn, rõ ràng và đúng trọng tâm câu hỏi. Nếu không có thông tin để trả lời, hãy thành thật thừa nhận. Không bịa ra thông tin không có trong công thức.`;
}

// Cập nhật hàm rule-based với các cải tiến
function getEnhancedAnswer(question, recipeContext) {
  const lowercaseQuestion = question.toLowerCase();
  console.log("Fallback to rule-based: ", lowercaseQuestion);
  
  // Thêm xử lý cho câu hỏi ngắn hoặc không rõ ràng
  if (lowercaseQuestion.length < 3 || lowercaseQuestion === 'ê') {
    return `Xin chào! Tôi là trợ lý ảo cho món ${recipeContext.title}. Bạn có thể hỏi tôi về nguyên liệu, cách nấu, hoặc mẹo nấu ăn cho món này. Tôi sẽ cố gắng giúp bạn!`;
  }
  
  // THÊM MỚI: Xử lý câu hỏi so sánh "X hay Y ngon hơn" / "X hay Y tốt hơn"
  if ((lowercaseQuestion.includes(' hay ') || lowercaseQuestion.includes(' hoặc ')) &&
      (lowercaseQuestion.includes(' hơn') || lowercaseQuestion.includes('ngon'))) {
    
    // Kiểm tra nếu là câu hỏi về loại gà
    if (lowercaseQuestion.includes('gà công nghiệp') || 
        lowercaseQuestion.includes('gà ta') || 
        lowercaseQuestion.includes('gà thả vườn')) {
      
      return `Về câu hỏi "${question}": Thông thường, gà ta (gà thả vườn) được đánh giá là ngon hơn và có hương vị đậm đà hơn so với gà công nghiệp. Gà ta thường có thịt chắc, ít mỡ và hương vị đặc trưng hơn.

Tuy nhiên, đối với món ${recipeContext.title}, công thức không chỉ định rõ loại gà nào. Bạn có thể dùng cả hai loại tùy theo khẩu vị và điều kiện của mình:

- Gà ta: Cho hương vị đậm đà, thịt chắc, thích hợp cho món kho
- Gà công nghiệp: Mềm hơn, dễ mua, giá thành thấp hơn

Khuyến nghị của tôi là nếu có điều kiện, hãy chọn gà ta để có hương vị truyền thống nhất cho món ${recipeContext.title}.`;
    }
    
    // Các loại so sánh khác
    return `Về câu hỏi "${question}": Công thức ${recipeContext.title} không chỉ định rõ về sự so sánh này. Đây là những gợi ý chung dựa trên kiến thức ẩm thực:

Nên chọn nguyên liệu tươi ngon, phù hợp với khẩu vị cá nhân của bạn. Mỗi loại nguyên liệu sẽ mang đến hương vị khác nhau cho món ăn.

Nếu bạn muốn biết thêm chi tiết, bạn có thể hỏi cụ thể hơn về công thức hoặc nguyên liệu đang được sử dụng.`;
  }
  
  // ĐÃ CẢI TIẾN: Từ khóa "hay" không còn được đưa vào nhóm tips
  const keywordGroups = {
    ingredients: ['nguyên liệu', 'cần những gì', 'cần gì', 'làm từ gì', 'nguyên vật liệu', 'gia vị', 'bao nhiêu', 'chuẩn bị gì'],
    cooking: ['làm sao', 'cách làm', 'hướng dẫn', 'nấu kiểu gì', 'chế biến', 'cách nấu', 'làm thế nào', 'làm như thế nào', 'cách chế biến', 
              'kho', 'nấu', 'chiên', 'xào', 'luộc', 'hấp', 'rán', 'nướng', 'quay', 'ướp', 'rim', 'om', 'chế biến'],
    time: ['thời gian', 'mất bao lâu', 'bao lâu', 'mất bao nhiêu', 'nấu trong', 'mất thời gian', 'bao nhiêu phút', 'bao nhiêu giờ'],
    tips: ['mẹo', 'lưu ý', 'chú ý', 'bí quyết', 'nên', 'không nên', 'tránh', 'kinh nghiệm', 'bí kíp'] // Loại bỏ từ "hay"
  };
  
  // Kiểm tra từng nhóm từ khóa
  for (const [type, keywords] of Object.entries(keywordGroups)) {
    for (const keyword of keywords) {
      if (lowercaseQuestion.includes(keyword)) {
        console.log(`Matched keyword: ${keyword} in group: ${type}`);
        
        // Xử lý câu trả lời dựa trên loại câu hỏi
        switch (type) {
          case 'ingredients':
            let answer = `Công thức "${recipeContext.title}" cần các nguyên liệu sau:\n\n`;
            if (recipeContext.ingredients && Array.isArray(recipeContext.ingredients)) {
              recipeContext.ingredients.forEach((ing, index) => {
                const amount = ing.amount || ing.quantity || 'vừa đủ';
                const unit = ing.unit || '';
                answer += `${index + 1}. ${ing.name || ''}: ${amount} ${unit}\n`;
              });
            } else {
              answer += "Danh sách nguyên liệu chưa được cung cấp đầy đủ.\n";
            }
            answer += "\nBạn cũng có thể thêm gia vị như muối, tiêu, hoặc nước mắm tùy theo khẩu vị.";
            return answer;
            
          case 'cooking':
            let stepsAnswer = `Để làm món ${recipeContext.title}, bạn cần thực hiện các bước sau:\n\n`;
            if (recipeContext.steps && Array.isArray(recipeContext.steps)) {
              recipeContext.steps.forEach((step, index) => {
                stepsAnswer += `Bước ${index + 1}: ${step.description || ''}\n`;
              });
            } else {
              stepsAnswer += "Các bước chi tiết chưa được cung cấp đầy đủ.\n";
            }
            return stepsAnswer;
            
          case 'time':
            return `Món ${recipeContext.title} này mất khoảng ${recipeContext.cookingTime || '30-45'} phút để hoàn thành, bao gồm cả thời gian chuẩn bị nguyên liệu.`;
            
          case 'tips':
            return `Một số mẹo để làm món ${recipeContext.title} ngon hơn:\n\n` +
                   `1. Chọn nguyên liệu tươi ngon.\n` +
                   `2. Nêm nếm vừa phải, thử và điều chỉnh theo khẩu vị.\n` +
                   `3. Kiên nhẫn và theo đúng các bước.\n` +
                   `4. Đọc kỹ công thức trước khi bắt đầu.\n` +
                   `5. ${recipeContext.thoughts || 'Trang trí món ăn đẹp mắt trước khi phục vụ.'}`;
        }
      }
    }
  }
  
  // THÊM MỚI: Phản hồi chung nếu không nhận diện được câu hỏi cụ thể
  return `Tôi hiểu bạn đang hỏi về món ${recipeContext.title}. Tuy nhiên, thông tin trong công thức không đủ để trả lời câu hỏi "${question}".

Bạn có thể hỏi cụ thể hơn về:
- Nguyên liệu cần có cho món này
- Cách làm/các bước thực hiện
- Thời gian nấu
- Mẹo nấu ngon

Ví dụ: "Món này cần những nguyên liệu gì?" hoặc "Làm sao để nấu món này?"`;
}