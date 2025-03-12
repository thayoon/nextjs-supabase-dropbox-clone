"use client";

import { useQuery } from "@tanstack/react-query";
import DropboxImage from "./dropbox-images";
import { searchFiles } from "actions/storageActions";
import {
  Spinner,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Button,
  Typography,
} from "@material-tailwind/react";
import { useState } from "react";

const sortMenu = [
  { title: "최신순", isLatest: true },
  { title: "오래된순", isLatest: false },
];
export default function DropboxImageList({ searchInput }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [isLatest, setIsLatest] = useState(true);
  const searchImageQuery = useQuery({
    queryKey: ["images", searchInput],
    queryFn: () => searchFiles(searchInput),
  });
  return (
    <div role="section">
      <div className="flex flex-row-reverse">
        <Menu open={openMenu} handler={setOpenMenu} allowHover>
          <MenuHandler>
            <Button
              variant="text"
              className="flex items-center gap-1 align-middle text-base font-normal capitalize tracking-normal"
            >
              {isLatest ? "최신순" : "오래된순"}
              <i
                className={`fas fa-angle-down transition-transform ${
                  openMenu ? "rotate-180" : ""
                }`}
              />
            </Button>
          </MenuHandler>
          <MenuList className="hidden gap-3 overflow-visible lg:grid">
            <ul className="flex w-full flex-col gap-1">
              {sortMenu.map(({ title, isLatest }) => (
                <MenuItem key={title} onClick={() => setIsLatest(isLatest)}>
                  <Typography variant="h6" color="blue-gray" className="mb-1">
                    {title}
                  </Typography>
                </MenuItem>
              ))}
            </ul>
          </MenuList>
        </Menu>
      </div>

      <section className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-2">
        {searchImageQuery.isLoading && <Spinner />}
        {searchImageQuery.data &&
          (isLatest
            ? searchImageQuery.data.map((image) => (
                <DropboxImage key={image.id} image={image} />
              ))
            : searchImageQuery.data
                .slice()
                .reverse()
                .map((image) => <DropboxImage key={image.id} image={image} />))}
      </section>
    </div>
  );
}
