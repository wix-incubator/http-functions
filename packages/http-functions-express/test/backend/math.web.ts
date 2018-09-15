export async function sum(...args: number[]): Promise<number> {
  return args.reduce((a, b) => a + b);
}

export async function divide(a: number, b: number): Promise<number> {
  if (b === 0) {
    throw new Error('division by zero');
  }
  return a / b;
}
