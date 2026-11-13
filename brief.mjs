import {MODEL} from './engine.mjs';
import {validateField,SEASONS} from './field.mjs';

/** A local audit snapshot, not a forecast or a complete offline replay bundle. */
export function buildDecisionBrief({field,scoring,climate,generatedAt}) {
  const checked=validateField(field);
  if(!checked.valid || !scoring?.current || !climate || !Number.isFinite(Date.parse(generatedAt)))throw new Error('A valid field, matching weather and comparison are required.');
  if(Number(checked.field.lat.toFixed(2))!==climate.point?.lat || Number(checked.field.lon.toFixed(2))!==climate.point?.lon)throw new Error('Weather does not match this field.');
  const plan=(row,label)=>row?{
    label,id:row.id,relative_score:row.total,climate_fit:row.climate_fit,priority_score:row.priority_score,
    confidence:row.confidence,water_rule:row.feasibility_label,water_warnings:row.feasibility_reasons,
    rule_adjustment:row.rule_adjust,rule_reasons:row.rule_reasons,calendar_warnings:row.warnings,
    seasons:Object.fromEntries(SEASONS.map(season=>[season,row.seasons[season]?{
      crop:row.seasons[season].crop,assumed_start_month:row.seasons[season].start,assumed_end_month:row.seasons[season].end,
      start_offset:row.seasons[season].start_offset,end_offset:row.seasons[season].end_offset,
      historical_metrics:row.season_metrics[season],model_fit:row.season_fits[season],
    }:null])),
  }:null;
  return structuredClone({schema:'terraplan.decision-brief.v1',generated_at:generatedAt,
    purpose:'Decision-support snapshot for local discussion. Relative rule scores are not yield, profit or weather forecasts.',
    field:checked.field,priority_weights:scoring.weights,max_rotation_water_need:scoring.max_rotation_water_need,
    selection_note:scoring.selection_note,model_constants:MODEL,
    historical_evidence:{point:climate.point,agricultural_year:climate.ag_year,source:climate.source,datasets:climate.datasets,
      grid_note:climate.grid_note,soil_note:climate.soil_note},
    plans:[plan(scoring.current,'Your current'),plan(scoring.options[0],'Option A'),plan(scoring.options[1],'Option B')],
    limitations:['Crop parameters and scoring rules are illustrative and need local agronomic validation.','A passing water-gap rule can still include a water shortfall; confirm the actual supply.','Coarse area weather is not a field measurement.','The 3D scene is an illustration. No yield or profit prediction is included.','Unmodelled crops and unavailable satellite evidence are not filled with invented values.','This snapshot records baseline comparison settings; What-if experiments remain separate.'],
  });
}
