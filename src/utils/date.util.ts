export class NigerianDateUtils {
  private static readonly NIGERIAN_TIMEZONE = 'Africa/Lagos';
  
  static getCurrentDate(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: this.NIGERIAN_TIMEZONE }));
  }
  
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }
  
  static isPublicHoliday(date: Date): boolean {
    // Nigerian public holidays - simplified list, in production fetch from API/db
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    const holidays = [
      { month: 1, day: 1 },   // New Year's Day
      { month: 4, day: 18 },  // Good Friday (varies, example)
      { month: 4, day: 21 },  // Easter Monday (varies)
      { month: 5, day: 1 },   // Workers' Day
      { month: 6, day: 12 },  // Democracy Day
      { month: 10, day: 1 },  // Independence Day
      { month: 12, day: 25 }, // Christmas Day
      { month: 12, day: 26 }, // Boxing Day
    ];
    
    return holidays.some(h => h.month === month && h.day === day);
  }
  
  static addBusinessDays(date: Date, days: number): Date {
    let result = new Date(date);
    let added = 0;
    
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (!this.isWeekend(result) && !this.isPublicHoliday(result)) {
        added++;
      }
    }
    return result;
  }
  
  static calculateDeliveryDate(orderDate: Date, estimatedDays: number, cutoffHour: number): Date {
    const orderHour = orderDate.getHours();
    let processingStart = new Date(orderDate);
    
    // Apply cutoff: orders after cutoff are processed next business day
    if (orderHour >= cutoffHour) {
      processingStart = this.addBusinessDays(processingStart, 1);
      processingStart.setHours(9, 0, 0, 0);
    }
    
    return this.addBusinessDays(processingStart, estimatedDays);
  }
}