/** Accessible annual-history chart. Missing years break the line; zero is valid. */
export function annualHistoryChart(rows,key){
  const rain=key==='rain_mm';
  if(!rain && key!=='tmax_c')return '';
  const label=rain?'Annual rainfall':'Annual mean maximum temperature',unit=rain?'mm':'°C';
  const sorted=(rows??[]).filter(row=>Number.isInteger(row.year)).toSorted((a,b)=>a.year-b.year);
  const valid=sorted.filter(row=>Number.isFinite(row[key]));
  if(valid.length<2)return `<p class="small-note">${label}: not enough complete annual values to draw a chart.</p>`;
  const first=sorted[0].year,last=sorted.at(-1).year;
  if(first===last)return '';
  const min=rain?Math.min(0,...valid.map(row=>row[key])):Math.min(...valid.map(row=>row[key]));
  const max=Math.max(...valid.map(row=>row[key])),span=max-min||1;
  const x=year=>50+(year-first)/(last-first)*280,y=value=>165-(value-min)/span*130;
  let segments=[],part=[],previous=null;
  for(const row of sorted){
    if(!Number.isFinite(row[key])){if(part.length)segments.push(part);part=[];previous=null;continue;}
    if(previous!==null && row.year!==previous+1){if(part.length)segments.push(part);part=[];}
    part.push(`${x(row.year).toFixed(2)},${y(row[key]).toFixed(2)}`);previous=row.year;
  }
  if(part.length)segments.push(part);
  return `<figure class="history-chart"><figcaption>${label} · ${first}–${last}</figcaption><svg viewBox="0 0 360 205" role="img" aria-label="${label} history in ${unit}, ${valid.length} complete years. The annual values table follows below. Gaps mean missing values."><path d="M50 30V165H340" fill="none" stroke="currentColor" opacity=".3"/><text x="44" y="40" text-anchor="end">${max.toFixed(1)}</text><text x="44" y="165" text-anchor="end">${min.toFixed(1)}</text><text x="50" y="190">${first}</text><text x="330" y="190" text-anchor="end">${last}</text>${segments.map(points=>`<polyline points="${points.join(' ')}" fill="none" stroke="currentColor" stroke-width="2"/>`).join('')}${valid.map(row=>`<circle cx="${x(row.year).toFixed(2)}" cy="${y(row[key]).toFixed(2)}" r="2.5"><title>${row.year}: ${row[key].toFixed(2)} ${unit}</title></circle>`).join('')}</svg><p class="small-note">Historical NASA POWER annual values · ${unit}. Gaps are missing years. Open the annual table for exact values. This line is not a forecast.</p></figure>`;
}
