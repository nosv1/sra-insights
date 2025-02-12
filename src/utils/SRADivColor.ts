type RGB = [number, number, number];

export class SRADivColor {
    static DIV_COLORS: { [key: number]: RGB } = {
        0: [192, 192, 192],  // silver
        1: [255, 255, 255],  // white
        2: [63, 63, 63],     // dark gray
        3: [255, 0, 0],      // red
        4: [127, 0, 127],    // bright purple
        5: [0, 128, 0],      // green
        6: [255, 165, 0],    // orange
    };

    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    [Symbol.iterator]() {
        return [this.r, this.g, this.b][Symbol.iterator]();
    }

    static fromDivision(division: number): SRADivColor {
        if (this.DIV_COLORS[division] === undefined)
            return new SRADivColor(0, 0, 0);

        const [r, g, b] = SRADivColor.DIV_COLORS[division];
        return new SRADivColor(r, g, b);
    }

    toRgba(opacity: number = 1.0): string {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${opacity})`;
    }

    applySilverTint(): SRADivColor {
        return new SRADivColor(...[...[this.r, this.g, this.b].map(c => Math.min((c + 200) / 2, 255)) as [number, number, number]]);
    }

    isBright(threshold: number = 255): boolean {
        return this.r + this.g + this.b >= threshold;
    }

    darken(factor: number = 0.25): SRADivColor {
        return new SRADivColor(...[...[this.r, this.g, this.b].map(c => Math.min(c - c * factor, 255)) as [number, number, number]]);
    }

    brighten(factor: number = 0.75): SRADivColor {
        return new SRADivColor(...[...[this.r, this.g, this.b].map(c => Math.max(c + (255 - c) * factor, 0)) as [number, number, number]]);
    }
}