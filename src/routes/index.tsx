import {
  component$,
  Resource,
  useResource$,
  useServerMount$,
  useStore,
} from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import {
  getBuilderSearchParams,
  getContent,
  RenderContent,
} from "@builder.io/sdk-qwik";

export const BUILDER_PUBLIC_API_KEY = "f5a098163c3741e19503f02a69360619";
export const BUILDER_MODEL = "page";

export default component$(() => {
  const location = useLocation();
  const editing = location.pathname.includes('localhost');
  if (editing === false) {
    const store = useStore({ resp: {  html: "" } });
    const apiUrl =  "https://cdn.builder.io/api/v1/qwik/" +
    BUILDER_MODEL +
    "?url=https%3A%2F%2Fcosmic-dusk-68b932.netlify.app%2F&apiKey=" +
    BUILDER_PUBLIC_API_KEY +
    "&limit=1&userAttributes.urlPath=" +
    location.pathname || "/";

    useServerMount$(async () => {
      const response = await fetch(apiUrl);
      store.resp = await response.json();
    });

    return <div dangerouslySetInnerHTML={store.resp.html} />;
  } else {
    const builderContentRsrc = useResource$<any>(() => {
      return getContent({
        model: BUILDER_MODEL,
        apiKey: BUILDER_PUBLIC_API_KEY,
        options: getBuilderSearchParams(location.query),
        userAttributes: {
          urlPath: location.pathname || "/",
        },
      });
    });

    return (
      <Resource
        value={builderContentRsrc}
        onPending={() => <div>Loading...</div>}
        onResolved={(content) => (
          <RenderContent
            model={BUILDER_MODEL}
            content={content}
            apiKey={BUILDER_PUBLIC_API_KEY}
          />
        )}
      />
    );
  }
});
