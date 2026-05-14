import axios from 'axios';

(async () => {
  try {
    const res = await axios.get('http://127.0.0.1:8000/api/movies/cinema?page=1');
    console.log('Cinema API Status:', res.status);
    console.log('Cinema API Keys:', Object.keys(res.data));
    console.log('Cinema API items length:', res.data.items?.length);
    console.log('Cinema API first item:', res.data.items?.[0]?.title || res.data.items?.[0]?.name);
    
    // Now simulate what normalizePaginated does
    let data = res.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        let items = [];
        let rawList = [];
        let input = data;
        if (Array.isArray(input)) rawList = input;
        else if (input.items && Array.isArray(input.items)) rawList = input.items;
        else if (input.data && Array.isArray(input.data)) rawList = input.data;
        else if (input.data?.items && Array.isArray(input.data.items)) rawList = input.data.items;
        
        console.log('Raw list length:', rawList.length);
        console.log('Raw list first item id:', rawList[0]?.id || rawList[0]?._id);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
