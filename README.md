## DropBox Clone

Next.js(Server Action, React Query, Material Tailwind) + Supabase

인프런 워밍업 스터디 3기 풀스택 2주차 미션2 입니다.  
[강의: [풀스택 완성]Supabase로 웹사이트 3개 클론하기(Next.js 14)](https://www.inflearn.com/course/%EC%9A%94%EC%A6%98%EC%97%94-supabase-%EB%8C%80%EC%84%B8%EC%A7%80-nextjs-%ED%81%B4%EB%A1%A0%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/dashboard)

### 미션: Dropbox Clone 프로젝트에 파일의 마지막 수정(업로드) 시간을 표시하는 기능 추가

**미션 해결 방법:**

**list() 응답값 확인**  
Supabase의 `list()` 함수를 사용하면 파일 정보를 가져올 수 있다.  
참고 문서에서 확인한 응답값은 다음과 같다:

```json
{
  "data": [
    {
      "name": "avatar1.png",
      "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
      "updated_at": "2024-05-22T23:06:05.580Z",
      "created_at": "2024-05-22T23:04:34.443Z",
      "last_accessed_at": "2024-05-22T23:04:34.443Z",
      "metadata": {
        "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
        "size": 32175,
        "mimetype": "image/png",
        "cacheControl": "max-age=3600",
        "lastModified": "2024-05-22T23:06:05.574Z",
        "contentLength": 32175,
        "httpStatusCode": 200
      }
    }
  ],
  "error": null
}
```

이 중에서 `updated_at`이 파일의 마지막 수정 시간을 나타낸다.

**Server Action에서 list() 호출 및 데이터 반환**  
`actions/storageActions.ts`

```typescript
export async function searchFiles(search: string = "") {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET)
    .list(null, {
      sortBy: { column: "updated_at", order: "desc" },
      search,
    });

  handleError(error);

  return data;
}
```

파일 목록을 가져오는 searchFiles() 함수를 구현한다.  
참고 문서를 통해 sortBy 옵션을 적용하여 updated_at 을 기준으로 내림차순 정렬하여 최신 파일이 먼저 오도록 설정한다.

**클라이언트 컴포넌트에서 데이터 가져오기**  
`components/dropbox-image-list.tsx`

```typescript
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

export default function DropboxImageList({ searchInput }) {
  const searchImageQuery = useQuery({
    queryKey: ["images", searchInput],
    queryFn: () => searchFiles(searchInput),
  });

  return (
    <section className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-2">
      {searchImageQuery.isLoading && <Spinner />}
      {searchImageQuery.data &&
        searchImageQuery.data.map((image) => (
          <DropboxImage key={image.id} image={image} />
        ))}
    </section>
  );
}
```

useQuery를 사용해 서버에서 데이터를 가져온다.  
가져온 데이터를 DropboxImage 컴포넌트로 전달한다.

**마지막 수정 시간 표시**  
`components/dropbox-images.tsx`

```typescript
"use client";

import { IconButton, Spinner, Checkbox } from "@material-tailwind/react";
import { getImageUrl } from "utils/supabase/storage";

export default function DropboxImage({ image }) {
  // 마지막 수정 시간 한국 시간 변환
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

  return (
    <div className="relative w-full flex flex-col gap-2 p-4 border border-gray-100 rounded-2xl shadow-md">
      {/* Image */}
      {/* fileName */}

      {/* update time */}
      <p className="flex justify-end text-xs text-gray-500">
        마지막 수정: {updated}
      </p>

      {/* trash Button */}
    </div>
  );
}
```

updated_at 값을 toLocaleString()을 사용해 한국 시간으로 변환하고 화면에 표시한다.

---

### 사진 다중 업로드

![upload](demo/multipleupload.gif)  
 `react-dragzone` 라이브러리 사용

### 사진 업데이트

![update](demo/update.gif)

### 사진 정렬 (추가 구현)

![sorting](demo/sorting.gif)  
처음에는 사용자의 정렬 방식 선택에 따라 서버에서 데이터를 다시 호출하도록 구현했지만,
비효율적이라고 판단하여 클라이언트에서 정렬을 처리하는 방식으로 변경했다.

**1차 시도 - 서버에서 정렬된 데이터 요청**  
`actions/storageAction.ts`

```typescript
export async function searchFiles(search: string = "", isLatest) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET)
    .list(null, {
      sortBy: { column: "updated_at", order: isLatest ? "desc" : "asc" },
      search,
    });

  handleError(error);

  return data;
}
```

- `isLatest` 값에 따라 정렬 순서를 desc(최신순) 또는 asc(오래된순)으로 설정
  사용자가 정렬 방식을 변경할 때마다 서버 요청이 발생하여 비효율적이다.

**2차 시도 - 클라이언트에서 정렬 처리**  
`components/dropbox-image-list.tsx`

```typescript
"use client";

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
import { useQuery } from "@tanstack/react-query";

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
    <div>
      {/* 정렬 버튼 */}
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

      {/* 이미지 리스트 */}
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
```

- 서버 요청은 기본적으로 최신순으로 설정하고, `isLatest` 상태에 따라 클라이언트에서 데이터를 `reverse()`하여 정렬을 변경하는 방식으로 개선했다.

### 사진 검색

![search](demo/search.gif)

### 사진 개별 삭제

![delete](demo/delete.gif)

### 사진 다중 삭제 (추가 구현)

![multipledelete](demo/multipledelete.gif)  
 사진을 다중 선택하여 삭제하는 기능은 체크박스를 활용해 구현했다.  
 사용자는 "전체 선택" 및 "선택 삭제" 기능을 통해 한 번에 여러 사진을 삭제할 수 있다.

`components/dropbox-image-list.tsx`

```typescript
"use client";

export default function DropboxImageList({ searchInput }) {
  // ...

  const [allSelected, setAllSelected] = useState(false); // 전체 선택 여부 관리
  const [isSelected, setIsSelected] = useState([]); // 선택된 이미지의 이름 저장

  // 사진 조회 query
  const searchImageQuery = useQuery({
    queryKey: ["images", searchInput],
    queryFn: () => searchFiles(searchInput),
  });
  // 파일 다중 삭제 mutation
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
        // 다중 선택, 선택 삭제 버튼
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
        // ...
      </div>

      <section className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-2">
        {searchImageQuery.isLoading && <Spinner />}
        {searchImageQuery.data &&
          searchImageQuery.data.map((image) => (
            <DropboxImage
              key={image.id}
              image={image}
              isSelected={isSelected}
              setIsSelected={setIsSelected}
              setAllSelected={setAllSelected}
              totalLength={searchImageQuery.data.length}
            />
          ))}
      </section>
    </div>
  );
}
```

- 전체 선택:  
  사용자가 "전체 선택" 체크박스를 클릭하면, 모든 이미지가 선택된다.  
  선택된 이미지 수와 총 이미지 수가 표시된다.
- 선택 삭제:  
  사용자가 선택한 이미지들을 삭제할 수 있는 "선택 삭제" 버튼을 제공한다.  
  이미지가 선택되었을 때만 활성화된다.
- 상태 관리:

  - isSelected 배열에 선택된 이미지의 이름을 저장한다.
  - allSelected 상태로 전체 선택 여부를 관리한다.

- 선택 삭제 버튼을 클릭하면 deleteFileMutation을 호출하여 isSelected을 전달하여 삭제를 처리한다.
- 삭제 작업이 완료되면 searchImageQuery.refetch()를 호출하여 이미지 리스트를 최신 상태로 갱신한다.

`components/dropbox-images.tsx`

```typescript
"use client";

export default function DropboxImage({
  image,
  isSelected,
  setIsSelected,
  setAllSelected,
  totalLength,
}) {
  const isChecked = isSelected.includes(image.name); // 현재 선택 여부

  const handleChecked = (checked) => {
    setIsSelected((prev) => {
      if (checked) {
        const newSelected = [...prev, image.name];
        if (newSelected.length === totalLength) setAllSelected(true);
        return newSelected;
      } else {
        setAllSelected(false);
        return prev.filter((item) => item !== image.name);
      }
    });
  };

  // ...

  return (
    <div className="relative w-full flex flex-col gap-2 p-4 border border-gray-100 rounded-2xl shadow-md">
      {/* Image */}
      {/* fileName */}
      {/* update time */}

      {/* multiple checkBox */}
      <div className="absolute top-4 left-4">
        <Checkbox
          color="blue"
          className="border-2 border-white bg-white/30 checked:border-white checked:bg-blue-500"
          checked={isChecked}
          onChange={(e) => handleChecked(e.target.checked)}
        />
      </div>

      {/* trash Button */}
    </div>
  );
}
```

- 개별 체크박스:  
  각 이미지에 대해 체크박스를 제공하고 사용자가 선택한 이미지를 isSelected 배열에 추가하거나 제거한다.
- 상태 변화:  
  체크박스를 클릭하면 해당 이미지가 선택되거나 선택이 해제되고 선택된 모든 이미지가 삭제될 때 "전체 선택" 체크박스도 자동으로 갱신된다.
- 상태 연동:
  - isChecked 개별 이미지에 체크박스의 체크 여부를 결정한다.
  - isSelected 배열에 현재 이미지의 name 값이 포함되어 있는지 true, false로 설정한다.
- 개별 이미지의 체크 여부가 isSelected 상태와 동기화된다.

`actions/storageActions.ts`

```typescript
export async function deleteFile(fileName: string[]) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET)
    .remove(fileName);

  handleError(error);

  return data;
}
```

- `supabase.storage.from(bucket).remove(['filename'])`을 통해 지정한 버킷에서 배열에 포함된 모든 파일을 삭제 요청한다.
