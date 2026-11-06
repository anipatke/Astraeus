// The page heading names the experience once it is open ("<label> · Astraeus"); app.html says only "Astraeus" until then. The site writes it; the viewer a host mounts leaves its page's title alone.

/** The product name, the heading alone when an experience declares no name. */
export const PAGE_TITLE = "Astraeus";

/** The page heading for an open experience: its own label before the product name; the product name alone when it declares none. */
export function pageTitle(label: string | undefined): string {
  return label === undefined || label.trim() === "" ? PAGE_TITLE : `${label} \u00b7 ${PAGE_TITLE}`;
}
