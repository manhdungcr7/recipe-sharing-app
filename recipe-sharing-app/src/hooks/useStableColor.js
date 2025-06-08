// Tạo file hook mới

import { useMemo } from 'react';

/**
 * Hook để tạo và giữ ổn định màu sắc giữa các lần render
 * @param {string|number} id - ID để tạo màu sắc ổn định
 * @returns {string} Mã màu HEX
 */
const useStableColor = (id) => {
  return useMemo(() => {
    // Sử dụng id hoặc bất kỳ giá trị nào khác làm seed
    const seed = id ? id.toString() : Math.random().toString();
    
    // Tạo một giá trị ngẫu nhiên nhưng ổn định dựa trên seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Chọn từ danh sách màu dựa trên hash
    const colors = [
      '#FF6B6B', '#4ECDC4', '#FFD166', '#6B5B95', '#88D8B0', '#F38181', 
      '#5BC0BE', '#F9C46B', '#A5A6F6', '#9AE190', '#FF9B94'
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }, [id]);
};

export default useStableColor;