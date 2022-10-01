import {
  component$,
  useServerMount$,
  useStore,
} from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import {
  RenderContent,
} from "@builder.io/sdk-qwik";

export const BUILDER_PUBLIC_API_KEY = "f5a098163c3741e19503f02a69360619";
export const BUILDER_MODEL = "page";

export default component$(() => {
  const location = useLocation();

  const store = useStore({ data: { results: [] } });

  useServerMount$(async () => {
    const response = await fetch(
      "https://cdn.builder.io/api/v2/content/page?apiKey=f5a098163c3741e19503f02a69360619&userAttributes.urlPath=" +
        location.pathname || "/" + "&limit=1"
    );
    store.data = await response.json();
  });

  return (
    <RenderContent
      model={BUILDER_MODEL}
      content={store.data.results[0]}
      apiKey={BUILDER_PUBLIC_API_KEY}
    />
  );
});
