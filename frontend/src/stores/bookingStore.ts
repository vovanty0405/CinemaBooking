import { create } from 'zustand';
import type { Booking, Seat } from '../types';

export interface ComboSelection {
  comboId: string;
  name: string;
  price: number;
  quantity: number;
}

interface BookingStore {
  currentBooking: Booking | null;
  selectedSeats: Seat[];
  selectedCombos: ComboSelection[];
  selectSeat: (seat: Seat) => void;
  deselectSeat: (seatId: string) => void;
  clearSeats: () => void;
  setBooking: (booking: Booking) => void;
  updateComboQuantity: (comboId: string, name: string, price: number, delta: number) => void;
  clearCombos: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  currentBooking: null,
  selectedSeats: [],
  selectedCombos: [],

  selectSeat: (seat) => set((state) => ({
    selectedSeats: [...state.selectedSeats, seat]
  })),

  deselectSeat: (seatId) => set((state) => ({
    selectedSeats: state.selectedSeats.filter(s => s._id !== seatId)
  })),

  clearSeats: () => set({ selectedSeats: [] }),

  setBooking: (booking) => set({ currentBooking: booking }),

  updateComboQuantity: (comboId, name, price, delta) => set((state) => {
    const existing = state.selectedCombos.find(c => c.comboId === comboId);
    if (existing) {
      const nextQuantity = existing.quantity + delta;
      if (nextQuantity <= 0) {
        return {
          selectedCombos: state.selectedCombos.filter(c => c.comboId !== comboId)
        };
      }
      return {
        selectedCombos: state.selectedCombos.map(c => 
          c.comboId === comboId ? { ...c, quantity: nextQuantity } : c
        )
      };
    } else {
      if (delta <= 0) return {};
      return {
        selectedCombos: [...state.selectedCombos, { comboId, name, price, quantity: delta }]
      };
    }
  }),

  clearCombos: () => set({ selectedCombos: [] })
}));
