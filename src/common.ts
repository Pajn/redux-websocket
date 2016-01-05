export interface Protocol {
  onmessage: (message: any) => void;
  send?: (message: Object) => void;
}
