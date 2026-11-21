import { checkedAbout, type AboutInput } from "./aboutInput";

/** What a `Scene` has planned for its About. */
export class AboutPlan {
  #about: AboutInput | undefined;

  /** Replaces the About; a bad one throws `bad-about` and leaves the earlier one in place. */
  set(input: AboutInput): void { this.#about = checkedAbout(input, "setAbout"); }

  /** The About as set (frozen); undefined when none was set. */
  get about(): AboutInput | undefined { return this.#about; }

  /** The definition's entry; absent when none was set. */
  entry(): { readonly about: AboutInput } | Record<string, never> {
    return this.#about === undefined ? {} : { about: this.#about };
  }
}
