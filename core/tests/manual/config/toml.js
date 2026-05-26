document.documentElement.classList.add("toml");

export const parse = (text) => {
  const json = {};
  if (/name\s*=s*(\S+)/.test(text))
    json.name = RegExp.$1;
  return json;
};
