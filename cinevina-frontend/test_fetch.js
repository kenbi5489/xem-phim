async function test() {
  try {
    const res = await fetch("http://localhost:5174/api/movies?category=phim-moi-cap-nhat&page=1");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Keys:", Object.keys(data));
    console.log("Items count:", data.items?.length);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
