"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import DropboxImage from "./dropbox-images";
import { searchFiles, deleteFile } from "actions/storageActions";
import {
  Spinner,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Button,
  Typography,
  Checkbox,
} from "@material-tailwind/react";
import { useState } from "react";

const sortMenu = [
  { title: "최신순", isLatest: true },
  { title: "오래된순", isLatest: false },
];
export default function DropboxImageList({ searchInput }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [isLatest, setIsLatest] = useState(true);
  const [allSelected, setAllSelected] = useState(false);
  const [isSelected, setIsSelected] = useState([]);

  const searchImageQuery = useQuery({
    queryKey: ["images", searchInput],
    queryFn: () => searchFiles(searchInput),
  });
  const deleteFileMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      searchImageQuery.refetch();
    },
  });

  function handleChecked(isChecked) {
    setAllSelected(isChecked);

    if (isChecked && searchImageQuery.data) {
      setIsSelected(searchImageQuery.data.map((image) => image.name));
    } else {
      setIsSelected([]);
    }
  }

  return (
    <div role="section">
      <div className="flex justify-between">
        <div className="flex justify-center items-center gap-3">
          <Checkbox
            color="blue"
            label={
              <Typography>
                전체 선택 ({isSelected.length}/
                {searchImageQuery.data && searchImageQuery.data.length}
                {!searchImageQuery.data && 0})
              </Typography>
            }
            checked={allSelected}
            onChange={(e) => handleChecked(e.target.checked)}
          />
          <Button
            className="rounded-full"
            size="sm"
            variant="outlined"
            color={isSelected.length > 0 ? "blue" : "gray"}
            disabled={isSelected.length > 0 ? false : true}
            onClick={() => {
              setIsSelected([]);
              setAllSelected(false);
              deleteFileMutation.mutate(isSelected);
            }}
          >
            {deleteFileMutation.isPending ? <Spinner /> : "선택 삭제"}
          </Button>
        </div>

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
          <MenuList className="hidden gap-3 overflow-visible lg:grid grid">
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
                <DropboxImage
                  key={image.id}
                  image={image}
                  isSelected={isSelected}
                  setIsSelected={setIsSelected}
                  setAllSelected={setAllSelected}
                  totalLength={searchImageQuery.data.length}
                />
              ))
            : searchImageQuery.data
                .slice()
                .reverse()
                .map((image) => (
                  <DropboxImage
                    key={image.id}
                    image={image}
                    isSelected={isSelected}
                    setIsSelected={setIsSelected}
                    setAllSelected={setAllSelected}
                    totalLength={searchImageQuery.data.length}
                  />
                )))}
      </section>
    </div>
  );
}
