const settable =
  'input:not([type]), ' +
  'input[type=text], ' +
  'input[type=hidden], ' +
  'input[type=email], ' +
  'input[type=password], ' +
  'input[type=search], ' +
  'input[type=tel], ' +
  'input[type=url], ' +
  'input[type=number],' +
  'input[type=date],' +
  'input[type=datetime-local],' +
  'input[type=month],' +
  'input[type=time],' +
  'input[type=week],' +
  'input[type=range],' +
  'textarea'

export default {
  settable,
  gettable: 'input,textarea',
}
