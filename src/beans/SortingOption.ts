import { Combination } from '../types';

export default class SortingOption {
  label: string;

  calculateFactor: (combo: Combination) => number;

  constructor(label: string, calculateFactor: (combo: Combination) => number) {
    this.label = label;
    this.calculateFactor = calculateFactor;
  }
}
