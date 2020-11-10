export class ConvertPrice {
  constructor(private price: number) {}
  getConvertedNumber = (): number => {
    let inputNumber: number = Math.ceil(this.price);
    return inputNumber;
  };
}
