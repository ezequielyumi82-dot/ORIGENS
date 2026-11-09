/* ORIGENS — Anatomia Viva v0.4. Cada decisão corporal tem custo e consequência. */
const Anatomy = (()=>{
 const defs={
  skeleton:{'Gelatinoso':{flex:3,armor:-1,weight:.35},'Cartilaginoso':{speed:2,armor:0,weight:.65},'Ósseo':{strength:3,armor:1,weight:1.15},'Exoesqueleto':{armor:3,growth:-1,weight:1.3}},
  respiration:{'Brânquias':{water:3,air:-2,eff:.8},'Pulmões':{air:3,water:-2,eff:.95},'Respiração cutânea':{water:1,air:1,eff:.65},'Filtração química':{toxic:3,eff:.55}},
  digestion:{'Filtração orgânica':{food:1.1,flex:1},'Estômago ácido':{food:1.45,cost:.2},'Fermentação':{food:.9,eff:.25},'Absorção química':{toxic:2,food:.75},'Reserva lipídica':{reserve:3,cost:.15}},
  senses:{'Visão diurna':{vision:3,dark:-1},'Visão noturna':{dark:3,vision:1},'Olfato':{tracking:3},'Campo elétrico':{water:3,dark:1},'Eco-localização':{dark:3,cost:.2},'Audição':{alert:3}},
  brain:{'Instintivo':{learn:.4,cost:0},'Curioso':{learn:1.4,curiosity:3,cost:.25},'Cooperativo':{learn:1,social:3,cost:.3},'Estratégico':{learn:2,plan:3,cost:.55}},
  immune:{'Tolerância básica':{immune:.4},'Anticorpos adaptativos':{immune:2,cost:.15},'Resistência natural':{immune:3,cost:.3}},
  reproduction:{'Divisão rápida':{offspring:3,care:-2},'Ovos numerosos':{offspring:2,care:-1},'Incubação interna':{offspring:-1,care:2,cost:.25},'Cuidado parental':{offspring:-1,care:3,cost:.2}}
 };
 const state={skeleton:'Gelatinoso',respiration:'Brânquias',digestion:'Filtração orgânica',senses:'Campo elétrico',brain:'Instintivo',immune:'Tolerância básica',reproduction:'Divisão rápida',legs:0,muscle:1,skin:'Translúcida',genes:{'Visão noturna':'Latente','Carapaça mineral':'Recessivo','Cauda propulsora':'Dominante','Neuroplasticidade':'Mutante'}};
 const geneCycle=['Dominante','Recessivo','Latente','Mutante'];
 function values(){let v={speed:1,strength:0,armor:0,weight:0,energy:0,eff:1,water:0,air:0,toxic:0,dark:0,immune:0,learn:0,offspring:0,care:0,flex:0,cost:0};for(const group of Object.keys(defs)){let mod=defs[group][state[group]];for(let k in mod)v[k]=(v[k]||0)+mod[k]}v.speed+=(state.legs*.34+state.muscle*.5);v.strength+=state.legs*.22+state.muscle*1.05;v.cost+=(state.legs*.13+state.muscle*.25+v.weight*.18);v.energy=Math.max(0,100-Math.round(v.cost*18));v.viable=Math.round(Math.max(0,Math.min(100,54+v.energy*.28+v.water*4+v.air*3+v.immune*3+v.armor*2-v.weight*5)));return v}
 function cycleGene(name){let i=geneCycle.indexOf(state.genes[name]);state.genes[name]=geneCycle[(i+1)%geneCycle.length]}
 return {defs,state,values,cycleGene,geneCycle};
})();
