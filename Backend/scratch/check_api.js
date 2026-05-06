async function check() {
  try {
    const res = await fetch('http://localhost:3000/api/especialidades');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Erro ao aceder à API:', err.message);
  }
}

check();
