"use client";

import { Input } from "@material-tailwind/react";

export default function SearchComponent({ searchInput, setSearchInput }) {
  return (
    <Input
      label="Search Images"
      icon={<i className="fas fa-search" />}
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
    />
  );
}
