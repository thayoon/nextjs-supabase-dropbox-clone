"use client";

import { IconButton, Spinner } from "@material-tailwind/react";
import { useMutation } from "@tanstack/react-query";
import { deleteFile } from "actions/storageActions";
import { queryClient } from "config/ReactQueryClientProvider";
import { getImageUrl } from "utils/supabase/storage";

export default function DropboxImage({ image }) {
  const updated = new Date(image.updated_at)
    .toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul",
    })
    .replace(",", "");
  const deleteFileMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["images"],
      });
    },
  });
  return (
    <div className="relative w-full flex flex-col gap-2 p-4 border border-gray-100 rounded-2xl shadow-md">
      {/* Image */}
      <div>
        <img
          src={getImageUrl(image.name)}
          alt="icon"
          className="w-full aspect-squre rounded-2xl"
        />
      </div>

      {/* fileName */}
      <div>{image.name}</div>

      {/* update time */}
      <p className="flex justify-end text-gray-500">
        마지막 수정 시간: {updated}
      </p>

      {/* trash Button */}
      <div className="absolute top-4 right-4">
        <IconButton
          onClick={() => {
            deleteFileMutation.mutate(image.name);
          }}
          color="red"
        >
          {deleteFileMutation.isPending ? (
            <Spinner />
          ) : (
            <i className="fas fa-trash" />
          )}
        </IconButton>
      </div>
    </div>
  );
}
