const selectors = (...sels) => {
  return sels.join(',')
}

const input = 'input'
const text = 'input[type=text]'
const hidden = 'input[type=hidden]'
const email = 'input[type=email]'
const password = 'input[type=password]'
const search = 'input[type=search]'
const tel = 'input[type=tel]'
const url = 'input[type=url]'
const number = 'input[type=number]'
const date = 'input[type=date]'
const radio = 'input[type=radio]'
const checkbox = 'input[type=checkbox]'
const datetimeLocal = 'input[type=datetime-local]'
const month = 'input[type=month]'
const time = 'input[type=time]'
const week = 'input[type=week]'
const range = 'input[type=range]'
const textarea = 'textarea'

const canSetText = selectors(
  text,
  hidden,
  email,
  password,
  search,
  tel,
  url,
  number,
  date,
  datetimeLocal,
  month,
  time,
  week,
  range,
  textarea
)

const canGetText = selectors(
  input,
  textarea,
)

const withPlaceholders = selectors(
  input,
  textarea,
)

const canBeClicked = selectors(
  radio,
  checkbox
)

module.exports = {
  canSetText,
  canGetText,
  withPlaceholders,
  canBeClicked
}
