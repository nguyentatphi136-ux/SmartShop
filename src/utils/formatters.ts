export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  })
    .format(amount)
    .replace('₫', 'đ');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}
