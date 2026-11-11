import { useEffect, useState } from 'react';
import { getProducts } from '../services/api.js';

const cop = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setState('loading');
    getProducts({ search }).then(data => { if (active) { setRows(data); setState('ready'); } })
      .catch(err => { if (active) { setError(err.message); setState('error'); } });
    return () => { active = false; };
  }, [search]);

  return <main className="page">
    <header><div><small>AUTOPARTES EL CAMINO</small><h1>Inventario</h1><p>Referencias ficticias para la demostracion.</p></div><b className="badge">MODO DEMO</b></header>
    <label className="search">Buscar repuesto, marca o codigo
      <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Ej. Bosch o filtro" />
    </label>
    {state === 'loading' && <p role="status">Cargando productos...</p>}
    {state === 'error' && <p role="alert" className="error">{error}</p>}
    {state === 'ready' && rows.length === 0 && <p>No encontramos productos.</p>}
    {state === 'ready' && rows.length > 0 && <div className="table-wrap"><table><thead><tr><th>Repuesto</th><th>Marca y SKU</th><th>Compatible</th><th>Precio</th><th>Existencias</th></tr></thead>
      <tbody>{rows.map(product => <tr key={product.id}><td>{product.name}<small>{product.category}</small></td><td>{product.brand}<small>{product.sku}</small></td><td>{product.compatibility || 'Sin compatibilidad'}</td><td>{cop(product.price)}</td><td><span className={product.stock <= product.minimum_stock ? 'low' : 'ok'}>{product.stock} {product.stock <= product.minimum_stock ? 'Reponer' : 'Disponible'}</span></td></tr>)}</tbody>
    </table></div>}
    <footer>Venta y pago se agregan en los siguientes sprints.</footer>
  </main>;
}
