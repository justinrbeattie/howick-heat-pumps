import { component$, useServerMount$, useStore } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";

export const BUILDER_PUBLIC_API_KEY = "f5a098163c3741e19503f02a69360619";
export const BUILDER_MODEL = "page";

export default component$(() => {
  const location = useLocation();
  const store = useStore({ resp: { html: "" } });
  const apiUrl =
    "https://cdn.builder.io/api/v1/qwik/" +
      BUILDER_MODEL +
      "?url=https%3A%2F%2Fcosmic-dusk-68b932.netlify.app%2F&apiKey=" +
      BUILDER_PUBLIC_API_KEY +
      "&limit=1&userAttributes.urlPath=" +
      location.pathname || "/" + location.query;

  useServerMount$(async () => {
    const response = await fetch(apiUrl);
    store.resp = await response.json();
  });

  return <div dangerouslySetInnerHTML={store.resp.html} />;
});
