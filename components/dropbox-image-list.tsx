"use client";

import DropboxImage from "./dropbox-images";

export default function DropboxImageList() {
  return (
    <section className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-2">
      <DropboxImage />
      <DropboxImage />
      <DropboxImage />
      <DropboxImage />
      <DropboxImage />
      <DropboxImage />
    </section>
  );
}
