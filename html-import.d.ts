declare type PromiseResponse = {
    element: HTMLHTMLImportElement;
    title: string;
};
declare class HTMLHTMLImportElement extends HTMLElement {
    #private;
    constructor(src?: string, selector?: string);
    private reset;
    private setDone;
    private setFail;
    get [Symbol.toStringTag](): string;
    static get observedAttributes(): string[];
    private connectedCallback;
    private disconnectedCallback;
    private attributeChangedCallback;
    reload(): Promise<PromiseResponse[]>;
    private import;
    fetch(url: string, signal: AbortSignal): Promise<string>;
    beforeReplaceContent(content: DocumentFragment): DocumentFragment;
    replaceContent(newContent: DocumentFragment): void;
    private load;
    get done(): Promise<PromiseResponse[]>;
    get src(): string;
    set src(value: string);
    get selector(): string;
    set selector(value: string);
}
declare const HTMLHTMLImportElementWithEvents_base: import("@sirpepe/oneventmixin").ExtendCtor<typeof HTMLHTMLImportElement, "importdone" | "importabort" | "importstart">;
declare class HTMLHTMLImportElementWithEvents extends HTMLHTMLImportElementWithEvents_base {
}
export { HTMLHTMLImportElementWithEvents as default };
