import axios from 'axios';
import { BACKEND_BASE_URL } from '../constants';

// Returns a axios chain
const FormSubmit = ({ rating, feedback }) => {
  const url = `${BACKEND_BASE_URL}/feedback`;
  return axios({
    method: 'post',
    url,
    data: {
      rating,
      feedback
    },
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });
};

export default FormSubmit;
