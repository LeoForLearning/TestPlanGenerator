import { useEffect } from "react";

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} • Test Plan Generator`;
  }, [title]);
};
