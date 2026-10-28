// Génère docs/diagrammes/fitbook.mdj (projet StarUML natif) : diagramme de classes + cas d'utilisation.
// Usage : node docs/diagrammes/outils/gen-staruml.js docs/diagrammes/fitbook.mdj
// Vérification / export : "C:\Program Files\StarUML\StarUML.exe" image docs/diagrammes/fitbook.mdj -f png -o "out/<%=element.name%>.png"
// Le fichier produit s'ouvre dans StarUML (Fichier > Ouvrir) et reste modifiable (mise en page, ajout d'éléments).
const fs = require('fs');
const out = process.argv[2] || 'fitbook.mdj';

let counter = 0;
const id = () => Buffer.from(String(++counter).padStart(12, '0')).toString('base64').slice(0, 16);
const ref = (o) => ({ $ref: o._id });
const FONT = 'Arial;13;0';

// ---------- modèle ----------
const project = { _type: 'Project', _id: id(), name: 'FitBook', ownedElements: [] };
const model = { _type: 'UMLModel', _id: id(), _parent: ref(project), name: 'FitBook', ownedElements: [] };
project.ownedElements.push(model);

const classDiagram = { _type: 'UMLClassDiagram', _id: id(), _parent: ref(model), name: 'Diagramme de classes', defaultDiagram: true, ownedViews: [] };
const ucDiagram = { _type: 'UMLUseCaseDiagram', _id: id(), _parent: ref(model), name: "Cas d'utilisation", ownedViews: [] };
model.ownedElements.push(classDiagram, ucDiagram);

// ---------- helpers vues ----------
function label(parent, text, visible = true, extra = {}) {
  return { _type: 'LabelView', _id: id(), _parent: ref(parent), visible, font: FONT, height: 13, ...(text !== undefined ? { text } : {}), ...extra };
}
function nameCompartment(parentView, modelEl, text, stereotype) {
  const nc = { _type: 'UMLNameCompartmentView', _id: id(), _parent: ref(parentView), model: ref(modelEl), subViews: [], font: FONT };
  const st = label(nc, stereotype ? `«${stereotype}»` : undefined, !!stereotype);
  const nm = label(nc, text, true, { font: 'Arial;13;1' });
  const ns = label(nc, undefined, false);
  const pr = label(nc, undefined, false);
  nc.subViews.push(st, nm, ns, pr);
  Object.assign(nc, { stereotypeLabel: ref(st), nameLabel: ref(nm), namespaceLabel: ref(ns), propertyLabel: ref(pr) });
  return nc;
}
function compartment(type, parentView, modelEl, visible = true) {
  return { _type: type, _id: id(), _parent: ref(parentView), model: ref(modelEl), subViews: [], font: FONT, visible };
}
function edgeLabel(parentView, modelEl, text, visible, alpha, distance, edgePosition) {
  return { _type: 'EdgeLabelView', _id: id(), _parent: ref(parentView), model: ref(modelEl), visible, font: FONT, height: 13, alpha, distance, hostEdge: ref(parentView), edgePosition, ...(text !== undefined ? { text } : {}) };
}
function center(v) { return [v.left + v.width / 2, v.top + v.height / 2]; }
function pointsBetween(a, b) { const [x1, y1] = center(a); const [x2, y2] = center(b); return `${Math.round(x1)}:${Math.round(y1)};${Math.round(x2)}:${Math.round(y2)}`; }

// ---------- diagramme de classes ----------
const classes = {};
const views = {};
function addClass(name, attrs, ops, x, y, isEnum = false, literals = []) {
  const el = { _type: isEnum ? 'UMLEnumeration' : 'UMLClass', _id: id(), _parent: ref(model), name, ownedElements: [], attributes: [], operations: [] };
  if (isEnum) el.literals = literals.map((l) => ({ _type: 'UMLEnumerationLiteral', _id: id(), _parent: ref(el), name: l }));
  attrs.forEach(([n, t]) => el.attributes.push({ _type: 'UMLAttribute', _id: id(), _parent: ref(el), name: n, visibility: 'private', type: t }));
  ops.forEach(([n, params, ret]) => {
    const op = { _type: 'UMLOperation', _id: id(), _parent: ref(el), name: n, visibility: 'public', parameters: [] };
    params.forEach(([pn, pt]) => op.parameters.push({ _type: 'UMLParameter', _id: id(), _parent: ref(op), name: pn, type: pt }));
    if (ret) op.parameters.push({ _type: 'UMLParameter', _id: id(), _parent: ref(op), type: ret, direction: 'return' });
    el.operations.push(op);
  });
  model.ownedElements.push(el);
  classes[name] = el;

  const rows = (isEnum ? literals.length : 0) + attrs.length + ops.length;
  const height = 30 + rows * 15 + 10;
  const width = 190;
  const v = { _type: isEnum ? 'UMLEnumerationView' : 'UMLClassView', _id: id(), _parent: ref(classDiagram), model: ref(el), subViews: [], font: FONT, containerChangeable: true, left: x, top: y, width, height, showNamespace: false, suppressAttributes: false, suppressOperations: false };
  const nc = nameCompartment(v, el, name, isEnum ? 'enumeration' : undefined);
  const ac = compartment('UMLAttributeCompartmentView', v, el);
  el.attributes.forEach((a) => ac.subViews.push({ _type: 'UMLAttributeView', _id: id(), _parent: ref(ac), model: ref(a), font: FONT, height: 13 }));
  const oc = compartment('UMLOperationCompartmentView', v, el);
  el.operations.forEach((o) => oc.subViews.push({ _type: 'UMLOperationView', _id: id(), _parent: ref(oc), model: ref(o), font: FONT, height: 13 }));
  const rc = compartment('UMLReceptionCompartmentView', v, el, false);
  const tc = compartment('UMLTemplateParameterCompartmentView', v, el, false);
  if (isEnum) {
    const lc = compartment('UMLEnumerationLiteralCompartmentView', v, el);
    el.literals.forEach((l) => lc.subViews.push({ _type: 'UMLEnumerationLiteralView', _id: id(), _parent: ref(lc), model: ref(l), font: FONT, height: 13 }));
    v.subViews.push(nc, lc, ac, oc, rc, tc);
    v.enumerationLiteralCompartment = ref(lc);
  } else {
    v.subViews.push(nc, ac, oc, rc, tc);
  }
  Object.assign(v, { nameCompartment: ref(nc), attributeCompartment: ref(ac), operationCompartment: ref(oc), receptionCompartment: ref(rc), templateParameterCompartment: ref(tc) });
  classDiagram.ownedViews.push(v);
  views[name] = v;
  return el;
}

// Ligne 1 : énumérations
addClass('Role', [], [], 40, 30, true, ['ROLE_USER', 'ROLE_COACH', 'ROLE_MANAGER', 'ROLE_ADMIN']);
addClass('Level', [], [], 270, 30, true, ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'TOUS_NIVEAUX']);
addClass('SessionStatus', [], [], 500, 30, true, ['PLANIFIEE', 'COMPLETE', 'ANNULEE', 'TERMINEE']);
addClass('BookingStatus', [], [], 730, 30, true, ['CONFIRMEE', 'ANNULEE', 'TERMINEE']);
addClass('ReviewStatus', [], [], 960, 30, true, ['EN_ATTENTE', 'APPROUVE', 'MASQUE']);

// Ligne 2
addClass('User', [['id', 'int'], ['email', 'string'], ['password', 'string'], ['firstName', 'string'], ['lastName', 'string'], ['phone', 'string'], ['avatarUrl', 'string'], ['roles', 'Role[]'], ['isVerified', 'bool'], ['isActive', 'bool'], ['createdAt', 'DateTime']], [['hasRole', [['role', 'Role']], 'bool'], ['verifyEmail', [], 'void']], 40, 190);
addClass('Coach', [['id', 'int'], ['specialty', 'string'], ['bio', 'text'], ['hourlyRate', 'decimal'], ['city', 'string'], ['isValidated', 'bool']], [['getAverageRating', [], 'float'], ['isAvailable', [['start', 'DateTime'], ['end', 'DateTime']], 'bool']], 500, 190);
addClass('Gym', [['id', 'int'], ['name', 'string'], ['description', 'text'], ['address', 'string'], ['city', 'string'], ['postalCode', 'string'], ['latitude', 'float'], ['longitude', 'float'], ['phone', 'string'], ['imageUrl', 'string'], ['totalCapacity', 'int']], [['getAverageRating', [], 'float'], ['distanceTo', [['lat', 'float'], ['lng', 'float']], 'float']], 960, 190);

// Ligne 3
addClass('Notification', [['id', 'int'], ['type', 'string'], ['subject', 'string'], ['content', 'text'], ['sentAt', 'DateTime'], ['isRead', 'bool']], [], 40, 480);
addClass('Availability', [['id', 'int'], ['dayOfWeek', 'int'], ['startsAt', 'Time'], ['endsAt', 'Time']], [], 500, 480);
addClass('Course', [['id', 'int'], ['title', 'string'], ['description', 'text'], ['level', 'Level'], ['durationMinutes', 'int'], ['price', 'decimal'], ['capacity', 'int'], ['imageUrl', 'string']], [['getUpcomingSessions', [], 'Session[]']], 730, 480);
addClass('OpeningHour', [['id', 'int'], ['dayOfWeek', 'int'], ['opensAt', 'Time'], ['closesAt', 'Time']], [], 960, 480);
addClass('Activity', [['id', 'int'], ['name', 'string'], ['description', 'text'], ['icon', 'string']], [], 1190, 480);

// Ligne 4
addClass('Booking', [['id', 'int'], ['bookedAt', 'DateTime'], ['status', 'BookingStatus'], ['seats', 'int'], ['qrCode', 'string']], [['canBeCancelled', [], 'bool'], ['renew', [], 'void']], 270, 700);
addClass('Session', [['id', 'int'], ['startAt', 'DateTime'], ['endAt', 'DateTime'], ['capacity', 'int'], ['price', 'decimal'], ['status', 'SessionStatus'], ['location', 'string']], [['getRemainingSeats', [], 'int'], ['isBookable', [], 'bool'], ['refreshStatus', [], 'void']], 730, 700);
addClass('Review', [['id', 'int'], ['rating', 'int'], ['comment', 'text'], ['createdAt', 'DateTime'], ['status', 'ReviewStatus']], [], 1190, 700);

function addAssociation(from, to, name, m1, m2, aggregation) {
  const a = classes[from], b = classes[to];
  const assoc = { _type: 'UMLAssociation', _id: id(), _parent: ref(a), name };
  assoc.end1 = { _type: 'UMLAssociationEnd', _id: id(), _parent: ref(assoc), reference: ref(a), multiplicity: m1, navigable: 'navigable', ...(aggregation ? { aggregation } : {}) };
  assoc.end2 = { _type: 'UMLAssociationEnd', _id: id(), _parent: ref(assoc), reference: ref(b), multiplicity: m2, navigable: 'navigable' };
  a.ownedElements.push(assoc);
  const va = views[from], vb = views[to];
  const v = { _type: 'UMLAssociationView', _id: id(), _parent: ref(classDiagram), model: ref(assoc), subViews: [], font: FONT, tail: ref(va), head: ref(vb), lineStyle: 1, points: pointsBetween(va, vb) };
  const nm = edgeLabel(v, assoc, name, !!name, 1.57, 15, 1);
  const st = edgeLabel(v, assoc, undefined, false, 1.57, 30, 1);
  const pr = edgeLabel(v, assoc, undefined, false, -1.57, 15, 1);
  const trn = edgeLabel(v, assoc.end1, undefined, false, 0.52, 30, 2);
  const tpr = edgeLabel(v, assoc.end1, undefined, false, -0.52, 25, 2);
  const tmu = edgeLabel(v, assoc.end1, m1, !!m1, -0.52, 25, 2);
  const hrn = edgeLabel(v, assoc.end2, undefined, false, -0.52, 30, 0);
  const hpr = edgeLabel(v, assoc.end2, undefined, false, 0.52, 25, 0);
  const hmu = edgeLabel(v, assoc.end2, m2, !!m2, 0.52, 25, 0);
  const tq = { _type: 'UMLQualifierCompartmentView', _id: id(), _parent: ref(v), model: ref(assoc.end1), visible: false, font: FONT, subViews: [] };
  const hq = { _type: 'UMLQualifierCompartmentView', _id: id(), _parent: ref(v), model: ref(assoc.end2), visible: false, font: FONT, subViews: [] };
  v.subViews.push(nm, st, pr, trn, tpr, tmu, hrn, hpr, hmu, tq, hq);
  Object.assign(v, { nameLabel: ref(nm), stereotypeLabel: ref(st), propertyLabel: ref(pr), tailRoleNameLabel: ref(trn), tailPropertyLabel: ref(tpr), tailMultiplicityLabel: ref(tmu), headRoleNameLabel: ref(hrn), headPropertyLabel: ref(hpr), headMultiplicityLabel: ref(hmu), tailQualifiersCompartment: ref(tq), headQualifiersCompartment: ref(hq) });
  classDiagram.ownedViews.push(v);
}
function addDependency(from, to, diagram = classDiagram, vmap = views, type = 'UMLDependency', name) {
  const a = classes[from] || ucModels[from], b = classes[to] || ucModels[to];
  const dep = { _type: type, _id: id(), _parent: ref(a), source: ref(a), target: ref(b), ...(name ? { name } : {}) };
  a.ownedElements = a.ownedElements || [];
  a.ownedElements.push(dep);
  const va = vmap[from], vb = vmap[to];
  const v = { _type: type + 'View', _id: id(), _parent: ref(diagram), model: ref(dep), subViews: [], font: FONT, tail: ref(va), head: ref(vb), lineStyle: 1, points: pointsBetween(va, vb) };
  const nm = edgeLabel(v, dep, name, !!name, 1.57, 15, 1);
  const st = edgeLabel(v, dep, undefined, false, 1.57, 30, 1);
  const pr = edgeLabel(v, dep, undefined, false, -1.57, 15, 1);
  v.subViews.push(nm, st, pr);
  Object.assign(v, { nameLabel: ref(nm), stereotypeLabel: ref(st), propertyLabel: ref(pr) });
  diagram.ownedViews.push(v);
}
function addNote(diagram, text, x, y, w, h, targetView) {
  const n = { _type: 'UMLNoteView', _id: id(), _parent: ref(diagram), font: FONT, left: x, top: y, width: w, height: h, text };
  diagram.ownedViews.push(n);
  if (targetView) {
    diagram.ownedViews.push({ _type: 'UMLNoteLinkView', _id: id(), _parent: ref(diagram), font: FONT, tail: ref(n), head: ref(targetView), lineStyle: 1, points: pointsBetween(n, targetView) });
  }
}

addAssociation('User', 'Coach', 'est', '1', '0..1');
addAssociation('User', 'Gym', 'gère', '1', '0..*');
addAssociation('User', 'Booking', 'effectue', '1', '0..*');
addAssociation('User', 'Review', 'rédige', '1', '0..*');
addAssociation('User', 'Notification', 'reçoit', '1', '0..*');
addAssociation('User', 'Gym', 'favoris (favori_salle)', '0..*', '0..*');
addAssociation('User', 'Coach', 'favoris (favori_coach)', '0..*', '0..*');
addAssociation('Gym', 'Course', 'propose', '1', '0..*', 'composite');
addAssociation('Gym', 'OpeningHour', 'ouvre', '1', '0..*', 'composite');
addAssociation('Activity', 'Course', 'catégorise', '1', '0..*');
addAssociation('Coach', 'Course', 'anime', '0..1', '0..*');
addAssociation('Coach', 'Availability', 'déclare', '1', '0..*', 'composite');
addAssociation('Course', 'Session', 'planifie', '0..1', '0..*');
addAssociation('Coach', 'Session', 'donne', '0..1', '0..*');
addAssociation('Session', 'Booking', 'concerne', '1', '0..*');
addAssociation('Booking', 'Notification', 'déclenche', '0..1', '0..*');
addAssociation('Gym', 'Review', 'reçoit', '0..1', '0..*');
addAssociation('Coach', 'Review', 'reçoit', '0..1', '0..*');
addDependency('User', 'Role');
addDependency('Course', 'Level');
addDependency('Session', 'SessionStatus');
addDependency('Booking', 'BookingStatus');
addDependency('Review', 'ReviewStatus');
addNote(classDiagram, "Contrainte XOR : une séance est liée\nsoit à un cours (séance collective),\nsoit à un coach (séance privée).", 960, 940, 260, 70, views.Session);
addNote(classDiagram, "Contrainte XOR : un avis cible\nsoit une salle, soit un coach.\nUn seul avis par auteur et par cible.", 1250, 940, 260, 70, views.Review);

// ---------- diagramme de cas d'utilisation ----------
const ucModels = {};
const ucViews = {};
function simpleView(type, diagram, el, x, y, w, h, extraCompartments = []) {
  const v = { _type: type, _id: id(), _parent: ref(diagram), model: ref(el), subViews: [], font: FONT, containerChangeable: true, left: x, top: y, width: w, height: h, suppressAttributes: true, suppressOperations: true, suppressReceptions: true, wordWrap: true };
  const nc = nameCompartment(v, el, el.name, el.stereotype);
  const ac = compartment('UMLAttributeCompartmentView', v, el, false);
  const oc = compartment('UMLOperationCompartmentView', v, el, false);
  const rc = compartment('UMLReceptionCompartmentView', v, el, false);
  const tc = compartment('UMLTemplateParameterCompartmentView', v, el, false);
  v.subViews.push(nc, ac, oc, rc, tc);
  Object.assign(v, { nameCompartment: ref(nc), attributeCompartment: ref(ac), operationCompartment: ref(oc), receptionCompartment: ref(rc), templateParameterCompartment: ref(tc) });
  extraCompartments.forEach(([type2, prop]) => { const c = compartment(type2, v, el, false); v.subViews.push(c); v[prop] = ref(c); });
  diagram.ownedViews.push(v);
  return v;
}
function addActor(key, name, x, y, stereotype) {
  const el = { _type: 'UMLActor', _id: id(), _parent: ref(model), name, ownedElements: [], attributes: [], operations: [], ...(stereotype ? { stereotype } : {}) };
  model.ownedElements.push(el);
  ucModels[key] = el;
  ucViews[key] = simpleView('UMLActorView', ucDiagram, el, x, y, 70, 90);
}
const packages = {};
const packageViews = {};
function addPackage(key, name, x, y, w, h) {
  const el = { _type: 'UMLPackage', _id: id(), _parent: ref(model), name, ownedElements: [] };
  model.ownedElements.push(el);
  packages[key] = el;
  const v = { _type: 'UMLPackageView', _id: id(), _parent: ref(ucDiagram), model: ref(el), subViews: [], font: FONT, containerChangeable: true, left: x, top: y, width: w, height: h, containedViews: [] };
  const nc = nameCompartment(v, el, name);
  v.subViews.push(nc);
  v.nameCompartment = ref(nc);
  ucDiagram.ownedViews.push(v);
  packageViews[key] = v;
}
function addUseCase(key, name, pkg, x, y, w = 200, h = 55) {
  const el = { _type: 'UMLUseCase', _id: id(), _parent: ref(packages[pkg]), name, ownedElements: [], attributes: [], operations: [], extensionPoints: [] };
  packages[pkg].ownedElements.push(el);
  ucModels[key] = el;
  const v = simpleView('UMLUseCaseView', ucDiagram, el, x, y, w, h, [['UMLExtensionPointCompartmentView', 'extensionPointCompartment']]);
  v.containerView = ref(packageViews[pkg]);
  packageViews[pkg].containedViews.push(ref(v));
  ucViews[key] = v;
}
function ucLink(from, to, kind, name) {
  // kind : 'assoc' (acteur -> cas), 'include', 'extend', 'general'
  const a = ucModels[from], b = ucModels[to];
  const va = ucViews[from], vb = ucViews[to];
  if (kind === 'assoc') {
    const assoc = { _type: 'UMLAssociation', _id: id(), _parent: ref(a), end1: null, end2: null };
    assoc.end1 = { _type: 'UMLAssociationEnd', _id: id(), _parent: ref(assoc), reference: ref(a) };
    assoc.end2 = { _type: 'UMLAssociationEnd', _id: id(), _parent: ref(assoc), reference: ref(b) };
    a.ownedElements.push(assoc);
    const v = { _type: 'UMLAssociationView', _id: id(), _parent: ref(ucDiagram), model: ref(assoc), subViews: [], font: FONT, tail: ref(va), head: ref(vb), lineStyle: 1, points: pointsBetween(va, vb) };
    const labels = [[assoc, 1.57, 15, 1], [assoc, 1.57, 30, 1], [assoc, -1.57, 15, 1], [assoc.end1, 0.52, 30, 2], [assoc.end1, -0.52, 25, 2], [assoc.end1, -0.52, 25, 2], [assoc.end2, -0.52, 30, 0], [assoc.end2, 0.52, 25, 0], [assoc.end2, 0.52, 25, 0]].map(([m, al, d, p]) => edgeLabel(v, m, undefined, false, al, d, p));
    const tq = { _type: 'UMLQualifierCompartmentView', _id: id(), _parent: ref(v), model: ref(assoc.end1), visible: false, font: FONT, subViews: [] };
    const hq = { _type: 'UMLQualifierCompartmentView', _id: id(), _parent: ref(v), model: ref(assoc.end2), visible: false, font: FONT, subViews: [] };
    v.subViews.push(...labels, tq, hq);
    const names = ['nameLabel', 'stereotypeLabel', 'propertyLabel', 'tailRoleNameLabel', 'tailPropertyLabel', 'tailMultiplicityLabel', 'headRoleNameLabel', 'headPropertyLabel', 'headMultiplicityLabel'];
    names.forEach((n, i) => (v[n] = ref(labels[i])));
    v.tailQualifiersCompartment = ref(tq);
    v.headQualifiersCompartment = ref(hq);
    ucDiagram.ownedViews.push(v);
    return;
  }
  const type = kind === 'include' ? 'UMLInclude' : kind === 'extend' ? 'UMLExtend' : 'UMLGeneralization';
  addDependency(from, to, ucDiagram, ucViews, type, name);
}

addActor('V', 'Visiteur', 40, 60);
addActor('S', 'Sportif', 40, 300);
addActor('C', 'Coach', 40, 520);
addActor('G', 'Gestionnaire de salle', 40, 720);
addActor('A', 'Administrateur', 40, 940);
addActor('M', "Serveur d'e-mails", 1280, 420, 'système');

addPackage('compte', 'Compte', 190, 30, 460, 220);
addPackage('recherche', 'Recherche et consultation', 680, 30, 520, 260);
addPackage('resa', 'Réservation', 190, 290, 460, 280);
addPackage('coach', 'Espace coach', 680, 330, 520, 230);
addPackage('gest', 'Espace gestionnaire', 190, 610, 460, 240);
addPackage('admin', 'Administration', 680, 610, 520, 240);

addUseCase('UC1', "S'inscrire", 'compte', 210, 70, 180);
addUseCase('UC1b', 'Confirmer son adresse e-mail', 'compte', 430, 70, 200);
addUseCase('UC2', 'Se connecter', 'compte', 210, 160, 180);
addUseCase('UC9', 'Gérer son profil', 'compte', 430, 160, 200);
addUseCase('UC3', 'Rechercher des salles, cours et coachs', 'recherche', 700, 70, 230, 60);
addUseCase('UC3b', 'Filtrer les résultats', 'recherche', 970, 70, 200, 60);
addUseCase('UC4', 'Consulter une fiche (salle, cours ou coach)', 'recherche', 700, 170, 230, 60);
addUseCase('UC7', 'Ajouter aux favoris', 'recherche', 970, 150, 200, 45);
addUseCase('UC8', 'Publier un avis et une note', 'recherche', 970, 215, 200, 45);
addUseCase('UC5', 'Réserver une séance', 'resa', 210, 330, 180);
addUseCase('UC5b', 'Contrôler la capacité de la séance', 'resa', 430, 330, 200, 60);
addUseCase('UC5c', "Envoyer l'e-mail de confirmation", 'resa', 430, 420, 200, 60);
addUseCase('UC6', 'Annuler sa réservation', 'resa', 210, 490, 180);
addUseCase('UC10', 'Gérer ses séances (créer, modifier, supprimer)', 'coach', 700, 370, 230, 65);
addUseCase('UC11', 'Définir ses disponibilités', 'coach', 970, 370, 200, 60);
addUseCase('UC12', 'Consulter ses réservations et ses avis reçus', 'coach', 700, 470, 230, 65);
addUseCase('UC13', 'Gérer sa salle, ses horaires et ses cours', 'gest', 210, 650, 200, 65);
addUseCase('UC14', "Planifier les séances d'un cours", 'gest', 430, 650, 200, 65);
addUseCase('UC15', 'Annuler une séance', 'gest', 210, 760, 200);
addUseCase('UC15b', 'Notifier les sportifs inscrits', 'gest', 430, 760, 200);
addUseCase('UC16', 'Administrer les utilisateurs et le catalogue', 'admin', 700, 650, 230, 65);
addUseCase('UC17', 'Gérer les réservations', 'admin', 970, 650, 200, 60);
addUseCase('UC18', 'Modérer les avis', 'admin', 970, 750, 200, 60);

['S', 'C', 'G', 'A'].forEach((k) => ucLink(k, 'V', 'general'));
[['V', 'UC1'], ['V', 'UC2'], ['V', 'UC3'], ['V', 'UC4'], ['S', 'UC9'], ['S', 'UC5'], ['S', 'UC6'], ['S', 'UC7'], ['S', 'UC8'], ['C', 'UC9'], ['C', 'UC10'], ['C', 'UC11'], ['C', 'UC12'], ['G', 'UC9'], ['G', 'UC13'], ['G', 'UC14'], ['G', 'UC15'], ['G', 'UC12'], ['A', 'UC16'], ['A', 'UC17'], ['A', 'UC18'], ['UC1b', 'M'], ['UC5c', 'M'], ['UC15b', 'M']].forEach(([a, b]) => ucLink(a, b, 'assoc'));
[['UC1', 'UC1b'], ['UC5', 'UC5b'], ['UC5', 'UC5c'], ['UC15', 'UC15b']].forEach(([a, b]) => ucLink(a, b, 'include'));
[['UC3b', 'UC3'], ['UC7', 'UC4'], ['UC8', 'UC4'], ['UC6', 'UC5']].forEach(([a, b]) => ucLink(a, b, 'extend'));
addNote(ucDiagram, "Condition d'extension :\nréservation terminée pour\ncette salle / ce coach", 1260, 200, 200, 60, ucViews.UC8);
addNote(ucDiagram, "Les acteurs Sportif, Coach, Gestionnaire et\nAdministrateur héritent du Visiteur :\nils peuvent rechercher et consulter comme lui.", 1260, 760, 260, 70);

fs.writeFileSync(out, JSON.stringify(project, null, '\t'));
console.log('écrit', out, 'vues classes =', classDiagram.ownedViews.length, 'vues UC =', ucDiagram.ownedViews.length);
