import { useParams } from 'react-router-dom'

function Transaction() {
  const { tx_hash } = useParams()

  return (
    <div>
      <h1>Transaction Details</h1>
      <p>Transaction Hash: {tx_hash}</p>
    </div>
  )
}

export default Transaction

