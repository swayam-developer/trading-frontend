import Toast from 'react-native-toast-message';
import { MarketStatusData } from '../stock/stock.types';

class MarketAlertService {
  private lastAlertKey: string | null = null;
  private lastAlertTime = 0;
  private MIN_ALERT_INTERVAL_MS = 60000; // 1 minute auto-throttle for identical alerts

  /**
   * Display a structured market status toast alert to the user.
   * @param status Current market status data from backend
   * @param force Set to true when triggered manually by user tap
   */
  public showMarketAlert(status: MarketStatusData, force = false): void {
    if (!status) return;

    const alertKey = this.generateAlertKey(status);
    const now = Date.now();

    // Prevent repeated popup noise unless forced by user tap or status changed
    if (!force && this.lastAlertKey === alertKey && now - this.lastAlertTime < this.MIN_ALERT_INTERVAL_MS) {
      return;
    }

    this.lastAlertKey = alertKey;
    this.lastAlertTime = now;

    // 1. Holiday Today Alert
    if (status.isHoliday || status.todayHoliday) {
      const holidayName = status.todayHoliday?.name || 'Scheduled Market Holiday';
      const resumeText = status.nextOpenFormatted
        ? ` Trading resumes on ${status.nextOpenFormatted} at 9:30 AM.`
        : ' Reopens on next trading session.';

      Toast.show({
        type: 'market_holiday',
        text1: `Market Holiday: ${holidayName} 🏖️`,
        text2: `Markets are closed today in observance of ${holidayName}.${resumeText}`,
        props: {
          dateRange: 'Today',
        },
        visibilityTime: 6000,
        autoHide: true,
      });
      return;
    }

    // 2. Upcoming Multi-Day Date Range Closure (e.g., within 3 days)
    const urgentClosure = status.upcomingClosures?.find(
      (c) => c.daysUntil >= 0 && c.daysUntil <= 3 && c.totalDays > 1
    );

    // 3. Market is Open Alert
    if (status.isOpen) {
      let message = status.alert?.message || 'Live trading is active until 3:30 PM.';
      let dateRange: string | undefined = undefined;

      if (status.isTomorrowClosed && status.tomorrowReason) {
        message = `Live trading active until 3:30 PM. Note: Closed tomorrow (${status.tomorrowReason}).`;
        dateRange = 'Closed Tomorrow';
      } else if (urgentClosure) {
        message = `Live trading active. Upcoming closure from ${urgentClosure.from} to ${urgentClosure.to} (${urgentClosure.reason}).`;
        dateRange = `${urgentClosure.from} - ${urgentClosure.to}`;
      }

      Toast.show({
        type: 'market_open',
        text1: status.alert?.title || 'Market is Open 🟢',
        text2: message,
        props: {
          dateRange,
        },
        visibilityTime: 5000,
        autoHide: true,
      });
      return;
    }

    // 4. Market is Closed Alert (Weekend, After-hours, or Closed Tomorrow)
    let title = status.alert?.title || 'Market is Closed 🔴';
    let message = status.alert?.message || status.message || 'Trading is closed.';
    let dateRange = status.alert?.dateRange;

    if (!status.isWeekDay) {
      title = 'Market Closed (Weekend) ⏸️';
      message = status.nextOpenFormatted
        ? `Markets are closed for the weekend. Reopens on ${status.nextOpenFormatted} at 9:30 AM.`
        : 'Markets are closed for the weekend. Reopens on Monday at 9:30 AM.';
      dateRange = 'Weekend';
    } else if (status.isTomorrowClosed && status.tomorrowReason) {
      dateRange = 'Closed Tomorrow';
      message = `Trading is closed. Note: Markets will also be closed tomorrow (${status.tomorrowReason}).`;
    }

    if (urgentClosure && !dateRange) {
      dateRange = `${urgentClosure.from} - ${urgentClosure.to}`;
      message = `${message} Upcoming multi-day closure from ${urgentClosure.from} to ${urgentClosure.to} (${urgentClosure.reason}).`;
    }

    Toast.show({
      type: 'market_closed',
      text1: title,
      text2: message,
      props: {
        dateRange,
      },
      visibilityTime: 6000,
      autoHide: true,
    });
  }

  private generateAlertKey(status: MarketStatusData): string {
    return `${status.isOpen ? 'OPEN' : 'CLOSED'}_${status.isHoliday ? 'HOLIDAY' : 'NOHOLIDAY'}_${
      status.todayHoliday?.name || ''
    }_${status.isTomorrowClosed ? 'T_CLOSED' : 'T_OPEN'}`;
  }
}

export const marketAlertService = new MarketAlertService();
