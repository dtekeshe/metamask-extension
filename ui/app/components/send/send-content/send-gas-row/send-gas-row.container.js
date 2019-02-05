import { connect } from 'react-redux'
import {
  getConversionRate,
  getCurrentCurrency,
  getGasTotal,
  getGasPrice,
  getGasLimit,
  getSendAmount,
} from '../../send.selectors.js'
import {
  isBalanceSufficient,
  calcGasTotal,
} from '../../send.utils.js'
import {
  getBasicGasEstimateLoadingStatus,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
} from '../../../../selectors/custom-gas'
import {
  hexWEIToDecGWEI,
  decGWEIToHexWEI,
  decimalToHex,
} from '../../../../helpers/conversions.util'
import {
  showGasButtonGroup,
} from '../../../../ducks/send.duck'
import {
  resetCustomData,
} from '../../../../ducks/gas.duck'
import { getGasLoadingError, gasFeeIsInError, getGasButtonGroupShown } from './send-gas-row.selectors.js'
import { showModal, setGasPrice, setGasLimit, setGasTotal } from '../../../../actions'
import { getAdvancedInlineGasShown, getCurrentEthBalance } from '../../../../selectors'
import SendGasRow from './send-gas-row.component'

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(SendGasRow)

function mapStateToProps (state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state)
  const gasPrice = getGasPrice(state)
  const activeButtonIndex = getDefaultActiveButtonIndex(gasButtonInfo, gasPrice)
  const renderableGasPrice = convertGasPrice(gasPrice)
  const renderableGasLimit = convertGasLimit(getGasLimit(state))

  const gasTotal = getGasTotal(state)
  const conversionRate = getConversionRate(state)
  const balance = getCurrentEthBalance(state)

  const insufficientBalance = !isBalanceSufficient({
    amount: getSendAmount(state),
    gasTotal,
    balance,
    conversionRate,
  })

  return {
    conversionRate,
    convertedCurrency: getCurrentCurrency(state),
    gasTotal,
    gasFeeError: gasFeeIsInError(state),
    gasLoadingError: getGasLoadingError(state),
    gasPriceButtonGroupProps: {
      buttonDataLoading: getBasicGasEstimateLoadingStatus(state),
      defaultActiveButtonIndex: 1,
      newActiveButtonIndex: activeButtonIndex > -1 ? activeButtonIndex : null,
      gasButtonInfo,
    },
    gasButtonGroupShown: getGasButtonGroupShown(state),
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    gasPrice: renderableGasPrice,
    gasLimit: renderableGasLimit,
    insufficientBalance,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () => dispatch(showModal({ name: 'CUSTOMIZE_GAS', hideBasic: true })),
    setGasPrice: (newPrice, gasLimit) => {
      newPrice = decGWEIToHexWEI(newPrice)
      dispatch(setGasPrice(newPrice))
      dispatch(setGasTotal(calcGasTotal(gasLimit, newPrice)))
    },
    setGasLimit: (newLimit, gasPrice) => {
      newLimit = decimalToHex(newLimit)
      dispatch(setGasLimit(newLimit))
      dispatch(setGasTotal(calcGasTotal(newLimit, gasPrice)))
    },
    showGasButtonGroup: () => dispatch(showGasButtonGroup()),
    resetCustomData: () => dispatch(resetCustomData()),
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const { gasPriceButtonGroupProps } = stateProps
  const { gasButtonInfo } = gasPriceButtonGroupProps
  const {
    setGasPrice: dispatchSetGasPrice,
    showGasButtonGroup: dispatchShowGasButtonGroup,
    resetCustomData: dispatchResetCustomData,
    ...otherDispatchProps
  } = dispatchProps

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: dispatchSetGasPrice,
    },
    resetGasButtons: () => {
      dispatchResetCustomData()
      dispatchSetGasPrice(gasButtonInfo[1].priceInHexWei)
      dispatchShowGasButtonGroup()
    },
    setGasPrice: dispatchSetGasPrice,
  }
}

function convertGasPrice (customGasPriceInHex) {
  return Number(hexWEIToDecGWEI(customGasPriceInHex))
}

function convertGasLimit (customGasLimitInHex) {
  return parseInt(customGasLimitInHex, 16)
}
