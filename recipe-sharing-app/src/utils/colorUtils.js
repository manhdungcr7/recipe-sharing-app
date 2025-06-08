/**
 * Hook tạo màu ổn định dựa trên ID
 * @param {string|number} id - ID để tạo màu
 * @returns {string} - Mã màu HEX
 */
import { useMemo } from 'react';

export const useStableColor = (id) => {
  return useMemo(() => {
    // Danh sách các màu pastel đẹp
    const colors = [
      '#FFD6D6', '#FFEFCF', '#DCFFE4', '#DAF2FF', '#E5DBFF',
      '#FFE2C8', '#D6FFDB', '#D6E8FF', '#F0D6FF', '#FFD6F1',
      '#C8F4FF', '#FFF9C8', '#FFD6D6', '#E5FFDA', '#D9E8FF'
    ];
    
    // Nếu không có ID, trả về một màu mặc định
    if (!id) return colors[0];
    
    // Chuyển ID thành số để lấy index
    let numericId;
    if (typeof id === 'number') {
      numericId = id;
    } else if (typeof id === 'string') {
      // Tạo một số từ chuỗi
      let hashCode = 0;
      for (let i = 0; i < id.length; i++) {
        hashCode = ((hashCode << 5) - hashCode) + id.charCodeAt(i);
        hashCode |= 0; // Chuyển thành 32bit integer
      }
      numericId = Math.abs(hashCode);
    } else {
      return colors[0];
    }
    
    // Lấy màu từ mảng colors dựa trên ID
    return colors[numericId % colors.length];
  }, [id]);
};