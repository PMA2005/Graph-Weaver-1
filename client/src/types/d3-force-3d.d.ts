declare module 'd3-force-3d' {
  export interface SimulationNode {
    id?: string;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
  }

  export interface SimulationLink<N extends SimulationNode = SimulationNode> {
    source: string | N;
    target: string | N;
  }

  export interface Force<N extends SimulationNode = SimulationNode, L extends SimulationLink<N> = SimulationLink<N>> {
    (alpha: number): void;
    initialize?(nodes: N[], random: () => number): void;
  }

  export interface Simulation<N extends SimulationNode = SimulationNode, L extends SimulationLink<N> = SimulationLink<N>> {
    nodes(): N[];
    nodes(nodes: N[]): this;
    alpha(): number;
    alpha(alpha: number): this;
    alphaMin(): number;
    alphaMin(min: number): this;
    alphaDecay(): number;
    alphaDecay(decay: number): this;
    alphaTarget(): number;
    alphaTarget(target: number): this;
    velocityDecay(): number;
    velocityDecay(decay: number): this;
    force(name: string): Force<N, L> | undefined;
    force(name: string, force: Force<N, L> | null): this;
    find(x: number, y: number, z?: number, radius?: number): N | undefined;
    randomSource(): () => number;
    randomSource(source: () => number): this;
    on(typenames: string): ((this: Simulation<N, L>) => void) | undefined;
    on(typenames: string, listener: ((this: Simulation<N, L>) => void) | null): this;
    tick(iterations?: number): this;
    restart(): this;
    stop(): this;
  }

  export function forceSimulation<N extends SimulationNode = SimulationNode>(
    nodes?: N[],
    numDimensions?: number
  ): Simulation<N>;

  export function forceLink<N extends SimulationNode = SimulationNode, L extends SimulationLink<N> = SimulationLink<N>>(
    links?: L[]
  ): {
    (alpha: number): void;
    links(): L[];
    links(links: L[]): typeof this;
    id(): (node: N, i: number, nodes: N[]) => string;
    id(id: (node: N, i: number, nodes: N[]) => string): typeof this;
    distance(): number | ((link: L, i: number, links: L[]) => number);
    distance(distance: number | ((link: L, i: number, links: L[]) => number)): typeof this;
    strength(): number | ((link: L, i: number, links: L[]) => number);
    strength(strength: number | ((link: L, i: number, links: L[]) => number)): typeof this;
    iterations(): number;
    iterations(iterations: number): typeof this;
  };

  export function forceManyBody<N extends SimulationNode = SimulationNode>(): {
    (alpha: number): void;
    strength(): number | ((node: N, i: number, nodes: N[]) => number);
    strength(strength: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
    theta(): number;
    theta(theta: number): typeof this;
    distanceMin(): number;
    distanceMin(distance: number): typeof this;
    distanceMax(): number;
    distanceMax(distance: number): typeof this;
  };

  export function forceCenter<N extends SimulationNode = SimulationNode>(
    x?: number,
    y?: number,
    z?: number
  ): {
    (alpha: number): void;
    x(): number;
    x(x: number): typeof this;
    y(): number;
    y(y: number): typeof this;
    z(): number;
    z(z: number): typeof this;
    strength(): number;
    strength(strength: number): typeof this;
  };

  export function forceCollide<N extends SimulationNode = SimulationNode>(): {
    (alpha: number): void;
    radius(): number | ((node: N, i: number, nodes: N[]) => number);
    radius(radius: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
    strength(): number;
    strength(strength: number): typeof this;
    iterations(): number;
    iterations(iterations: number): typeof this;
  };

  export function forceX<N extends SimulationNode = SimulationNode>(x?: number): {
    (alpha: number): void;
    strength(): number | ((node: N, i: number, nodes: N[]) => number);
    strength(strength: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
    x(): number | ((node: N, i: number, nodes: N[]) => number);
    x(x: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
  };

  export function forceY<N extends SimulationNode = SimulationNode>(y?: number): {
    (alpha: number): void;
    strength(): number | ((node: N, i: number, nodes: N[]) => number);
    strength(strength: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
    y(): number | ((node: N, i: number, nodes: N[]) => number);
    y(y: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
  };

  export function forceZ<N extends SimulationNode = SimulationNode>(z?: number): {
    (alpha: number): void;
    strength(): number | ((node: N, i: number, nodes: N[]) => number);
    strength(strength: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
    z(): number | ((node: N, i: number, nodes: N[]) => number);
    z(z: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
  };

  export function forceRadial<N extends SimulationNode = SimulationNode>(
    radius?: number | ((node: N, i: number, nodes: N[]) => number),
    x?: number,
    y?: number,
    z?: number
  ): {
    (alpha: number): void;
    strength(): number | ((node: N, i: number, nodes: N[]) => number);
    strength(strength: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
    radius(): number | ((node: N, i: number, nodes: N[]) => number);
    radius(radius: number | ((node: N, i: number, nodes: N[]) => number)): typeof this;
    x(): number;
    x(x: number): typeof this;
    y(): number;
    y(y: number): typeof this;
    z(): number;
    z(z: number): typeof this;
  };
}
