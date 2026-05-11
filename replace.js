const fs = require('fs');

let createContent = fs.readFileSync('app/app/items/create.tsx', 'utf8');
let editContent = fs.readFileSync('app/app/items/edit.tsx', 'utf8');

const createLayoutStart = createContent.indexOf('\n  return (\n    <VStack style={{ flex: 1, backgroundColor: \'#f8fafc\' }}>');
const createLayout = createContent.slice(createLayoutStart);

const editLayoutStart = editContent.indexOf('\n  return (\n    <VStack className="flex-1 bg-slate-50/50">');
const editLayoutEnd = editContent.length;

let newEditLayout = createLayout
  .replace('Adicionar item', 'Editar item')
  .replace(
    '<MenuItem key="save-add" textValue="Salvar e adicionar outro" onPress={() => handleSave(true)}>\n              <MenuItemLabel size="sm">Salvar e adicionar outro</MenuItemLabel>\n            </MenuItem>', 
    ''
  )
  .replace(
    'Salvar e fechar', 'Salvar'
  )
  .replace(
    'Salvar e fechar', 'Salvar'
  );

fs.writeFileSync('app/app/items/edit.tsx', editContent.slice(0, editLayoutStart) + newEditLayout);
