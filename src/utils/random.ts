export const randomIntInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
export const randomSize = (min: number, max: number) => `${randomIntInRange(min, max)}px`;
